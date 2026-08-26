import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { PatientDialogComponent } from './patient-dialog.component';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-patients-page',
  imports: [RouterLink, AvatarComponent, PatientDialogComponent],
  templateUrl: './patients-page.component.html',
})
export class PatientsPageComponent implements OnInit, OnDestroy {
  readonly patients = signal<Patient[]>([]);
  readonly dialogOpen = signal(false);
  readonly editing = signal<Patient | null>(null);
  readonly pendingDeletion = signal<Patient | null>(null);
  readonly currentSearch = signal('');
  readonly currentPage = signal(1);
  readonly lastPage = signal(1);
  readonly total = signal(0);
  readonly pageFrom = signal(0);
  readonly pageTo = signal(0);
  readonly pageNumbers = computed(() => {
    const lastPage = this.lastPage();
    const currentPage = this.currentPage();
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });
  private readonly searchTerms = new Subject<string>();
  private readonly subscriptions = new Subscription();
  private requestSequence = 0;
  constructor(
    private readonly service: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly photos: PhotoCacheService,
  ) {}
  ngOnInit() {
    this.subscriptions.add(
      this.searchTerms.pipe(debounceTime(350), distinctUntilChanged()).subscribe((term) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { search: term.trim() || null, page: null },
          queryParamsHandling: 'merge',
        });
      }),
    );
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const search = params.get('search') ?? '';
        const parsedPage = Number(params.get('page') ?? 1);
        const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        this.currentSearch.set(search);
        void this.loadPage(search, page);
      }),
    );
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  onSearch(term: string) {
    this.searchTerms.next(term);
  }
  goToPage(page: number) {
    if (page < 1 || page > this.lastPage() || page === this.currentPage()) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page === 1 ? null : page },
      queryParamsHandling: 'merge',
    });
  }
  create() {
    this.editing.set(null);
    this.dialogOpen.set(true);
  }
  edit(patient: Patient) {
    this.editing.set(patient);
    this.dialogOpen.set(true);
  }
  close() {
    this.dialogOpen.set(false);
  }
  saved() {
    this.close();
    void this.loadPage(this.currentSearch(), this.currentPage());
  }
  canDelete(): boolean {
    return this.auth.can('patients.delete');
  }
  requestDeletion(patient: Patient) {
    this.pendingDeletion.set(patient);
  }
  cancelDeletion() {
    this.pendingDeletion.set(null);
  }
  async confirmDeletion() {
    const patient = this.pendingDeletion();
    if (!patient) return;

    const deleted = await this.feedback.run(async () => {
      await this.service.delete(patient.id);
      return true;
    });
    if (!deleted) return;

    this.photos.invalidate('patient', patient.id);
    this.pendingDeletion.set(null);
    this.feedback.success('Paciente excluído com sucesso.');
    const previousPage = this.currentPage() > 1 && this.patients().length === 1;
    if (previousPage) this.goToPage(this.currentPage() - 1);
    else await this.loadPage(this.currentSearch(), this.currentPage());
  }
  private async loadPage(search: string, page: number) {
    const request = ++this.requestSequence;
    const response = await this.feedback.run(() => this.service.list(search, page));
    if (!response || request !== this.requestSequence) return;

    const meta = response.meta;
    const lastPage = Math.max(1, meta?.last_page ?? 1);
    if (page > lastPage) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: lastPage === 1 ? null : lastPage },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    this.patients.set(response.data);
    this.currentPage.set(meta?.current_page ?? page);
    this.lastPage.set(lastPage);
    this.total.set(meta?.total ?? response.data.length);
    this.pageFrom.set(meta?.from ?? (response.data.length ? (page - 1) * 15 + 1 : 0));
    this.pageTo.set(meta?.to ?? (page - 1) * 15 + response.data.length);
  }
}
