import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { AuditLogsService } from '../../core/audit-logs/audit-logs.service';
import { AuditEventOption, AuditLog, AuditLogFilters, AuditLogOptions, User } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { UsersService } from '../../core/users/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { AuditEventMultiselectComponent } from './audit-event-multiselect.component';

interface ChangedField {
  key: string;
  before: unknown;
  after: unknown;
}

interface UserRequest {
  term: string;
  page: number;
  append: boolean;
}

@Component({
  selector: 'app-audit-logs-page',
  imports: [DatePipe, FormsModule, NgSelectModule, AvatarComponent, AuditEventMultiselectComponent],
  templateUrl: './audit-logs-page.component.html',
})
export class AuditLogsPageComponent implements OnInit, OnDestroy {
  readonly logs = signal<AuditLog[]>([]);
  readonly options = signal<AuditLogOptions>({ events: [], users: [] });
  readonly users = signal<User[]>([]);
  readonly loadingUsers = signal(false);
  readonly userSearchTerms = new Subject<string>();
  readonly expandedId = signal<number | null>(null);
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);

  filters: AuditLogFilters = this.emptyFilters();

  private currentUserTerm = '';
  private currentUserPage = 0;
  private lastUserPage = 1;
  private readonly userRequests = new Subject<UserRequest>();
  private readonly subscriptions = new Subscription();

  private readonly fieldLabels: Record<string, string> = {
    name: 'Nome',
    email: 'E-mail',
    password: 'Senha',
    phone: 'Telefone',
    document: 'Documento',
    birth_date: 'Data de nascimento',
    address: 'Endereço',
    profession: 'Profissão',
    is_active: 'Status do usuário',
    photo_path: 'Foto',
    status: 'Status',
    patient_id: 'Paciente',
    professional_id: 'Profissional',
    access_groups: 'Grupos de acesso',
    permissions: 'Permissões',
    assessed_at: 'Data da avaliação',
    evolved_at: 'Data da evolução',
    pain_level: 'Nível de dor',
    observations: 'Observações',
    reason: 'Motivo',
    process_id: 'Processamento',
    chunk_id: 'Bloco de áudio',
    audio_mime_type: 'Formato do áudio',
    audio_size: 'Tamanho do áudio',
    chunks_count: 'Quantidade de blocos',
  };

  constructor(
    private readonly service: AuditLogsService,
    private readonly usersService: UsersService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.setupUserSearch();
    void this.feedback.run(async () => {
      const [options, logs] = await Promise.all([
        this.service.options(),
        this.service.list(this.filters),
      ]);
      this.options.set(options.data);
      this.setPage(logs);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  applyFilters(): void {
    void this.loadPage(1);
  }

  clearFilters(): void {
    this.filters = this.emptyFilters();
    void this.loadPage(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage() || page === this.currentPage()) return;
    void this.loadPage(page);
  }

  toggleDetails(log: AuditLog): void {
    this.expandedId.set(this.expandedId() === log.id ? null : log.id);
  }

  changedFields(log: AuditLog): ChangedField[] {
    const keys = new Set([...Object.keys(log.old_values), ...Object.keys(log.new_values)]);
    return [...keys].map((key) => ({
      key,
      before: log.old_values[key],
      after: log.new_values[key],
    }));
  }

  metadata(log: AuditLog): [string, unknown][] {
    return Object.entries(log.metadata).filter(([key]) => !['method', 'path'].includes(key));
  }

  hasDetails(log: AuditLog): boolean {
    return this.changedFields(log).length > 0 || this.metadata(log).length > 0;
  }

  fieldLabel(key: string): string {
    return this.fieldLabels[key] ?? key.replaceAll('_', ' ');
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (value === '[REDACTED]') return 'Conteúdo protegido';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) {
      if (!value.length) return 'Nenhum';
      return value
        .map((item) =>
          typeof item === 'object' && item !== null && 'name' in item
            ? String(item.name)
            : String(item),
        )
        .join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return (
      {
        invalid_credentials: 'Credenciais inválidas',
        inactive_user: 'Usuário inativo',
      }[String(value)] ?? String(value)
    );
  }

  eventClass(event: AuditEventOption | AuditLog): string {
    const group = 'event_group' in event ? event.event_group : event.group;
    return group
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replaceAll(' ', '-');
  }

  loadNextUserPage(): void {
    if (this.loadingUsers() || this.currentUserPage >= this.lastUserPage) return;
    this.requestUserPage(this.currentUserPage + 1, true);
  }

  private async loadPage(page: number): Promise<void> {
    await this.feedback.run(async () => this.setPage(await this.service.list(this.filters, page)));
  }

  private setPage(response: Awaited<ReturnType<AuditLogsService['list']>>): void {
    this.logs.set(response.data);
    this.currentPage.set(response.meta?.current_page ?? 1);
    this.lastPage.set(response.meta?.last_page ?? 1);
    this.total.set(response.meta?.total ?? response.data.length);
    this.expandedId.set(null);
  }

  private setupUserSearch(): void {
    this.subscriptions.add(
      this.userRequests
        .pipe(
          tap(() => this.loadingUsers.set(true)),
          switchMap((request) =>
            this.usersService.query(request.term, request.page, 20).pipe(
              map((response) => ({ request, response })),
              catchError((error: unknown) => {
                this.feedback.failure(error);
                return of({ request, response: null });
              }),
            ),
          ),
        )
        .subscribe(({ request, response }) => {
          this.loadingUsers.set(false);
          if (!response || request.term !== this.currentUserTerm) return;

          const selected = this.users().find((user) => user.id === this.filters.user_id);
          const incoming = request.append ? [...this.users(), ...response.data] : response.data;
          if (selected && !incoming.some((user) => user.id === selected.id)) incoming.unshift(selected);
          this.users.set(
            incoming.filter(
              (user, index, users) => users.findIndex((candidate) => candidate.id === user.id) === index,
            ),
          );
          this.currentUserPage = response.meta?.current_page ?? request.page;
          this.lastUserPage = response.meta?.last_page ?? 1;
        }),
    );
    this.subscriptions.add(
      this.userSearchTerms.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
        this.currentUserTerm = term.trim();
        this.requestUserPage(1, false);
      }),
    );
    this.requestUserPage(1, false);
  }

  private requestUserPage(page: number, append: boolean): void {
    this.userRequests.next({ term: this.currentUserTerm, page, append });
  }

  private emptyFilters(): AuditLogFilters {
    return { events: [], user_id: null, date_from: '', date_to: '' };
  }
}
