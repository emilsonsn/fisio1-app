import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ClinicalRecordsService } from '../../core/clinical-records/clinical-records.service';
import { formatDateBr } from '../../core/date-format';
import {
  Assessment,
  ClinicalAiProcess,
  ClinicalRecordStatus,
  Evolution,
  Patient,
  User,
} from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { PatientSelectComponent } from '../../shared/patient-select/patient-select.component';

interface RecordRow {
  id: number;
  type: 'initial_assessment' | 'evolution';
  patient: Patient;
  professional: User;
  performedAt: string;
  status: ClinicalRecordStatus;
  process: ClinicalAiProcess | null;
}

@Component({
  selector: 'app-clinical-records-page',
  imports: [FormsModule, AvatarComponent, PatientSelectComponent],
  templateUrl: './clinical-records-page.component.html',
})
export class ClinicalRecordsPageComponent implements OnInit, OnDestroy {
  readonly formatDate = formatDateBr;
  readonly assessments = signal<Assessment[]>([]);
  readonly evolutions = signal<Evolution[]>([]);
  readonly cancelling = signal<RecordRow | null>(null);
  activeTab: 'all' | 'in_review' = 'all';
  patientId: number | null = null;
  statusFilter: ClinicalRecordStatus | '' = '';
  typeFilter = 'all';
  dateFrom = '';
  dateTo = '';
  cancellationReason = '';
  private pollTimer?: number;
  private readonly subscriptions = new Subscription();
  private requestSequence = 0;
  rows(): RecordRow[] {
    const rows: RecordRow[] = [
      ...this.assessments().map((item) => ({
        id: item.id,
        type: 'initial_assessment' as const,
        patient: item.patient,
        professional: item.professional,
        performedAt: item.assessed_at,
        status: item.status,
        process: item.ai_process,
      })),
      ...this.evolutions().map((item) => ({
        id: item.id,
        type: 'evolution' as const,
        patient: item.patient,
        professional: item.professional,
        performedAt: item.evolved_at,
        status: item.status,
        process: item.ai_process,
      })),
    ];
    return rows
      .filter((row) => this.typeFilter === 'all' || row.type === this.typeFilter)
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  }
  constructor(
    private readonly service: ClinicalRecordsService,
    private readonly feedback: FeedbackService,
    private readonly route: ActivatedRoute,
    readonly auth: AuthService,
    readonly router: Router,
  ) {}
  ngOnInit() {
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const parsedPatientId = Number(params.get('patient') ?? 0);
        this.patientId =
          Number.isInteger(parsedPatientId) && parsedPatientId > 0 ? parsedPatientId : null;
        void this.feedback.run(() => this.refresh());
      }),
    );
  }
  ngOnDestroy() {
    window.clearTimeout(this.pollTimer);
    this.subscriptions.unsubscribe();
  }
  async refresh() {
    const request = ++this.requestSequence;
    const filters = {
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      patientId: this.patientId,
      perPage: 100,
      status: this.currentStatusFilter(),
    };
    const [assessments, evolutions] = await Promise.all([
      this.service.assessments(filters),
      this.service.evolutions(filters),
    ]);
    if (request !== this.requestSequence) return;

    this.assessments.set(assessments.data);
    this.evolutions.set(evolutions.data);
    window.clearTimeout(this.pollTimer);
    if ([...assessments.data, ...evolutions.data].some((record) => record.status === 'pending'))
      this.pollTimer = window.setTimeout(
        () => void this.refresh().catch(() => this.schedulePoll()),
        5000,
      );
  }
  applyDateFilters() {
    void this.feedback.run(() => this.refresh());
  }
  clearDateFilters() {
    this.dateFrom = '';
    this.dateTo = '';
    void this.feedback.run(() => this.refresh());
  }
  changeTab(tab: 'all' | 'in_review') {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    void this.feedback.run(() => this.refresh());
  }
  onPatientFilterChange(patientId: number | null) {
    this.patientId = patientId;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { patient: patientId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    void this.feedback.run(() => this.refresh());
  }
  onStatusFilterChange(status: ClinicalRecordStatus | '') {
    this.statusFilter = status;
    void this.feedback.run(() => this.refresh());
  }
  clearFilters() {
    this.patientId = null;
    this.statusFilter = '';
    this.typeFilter = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { patient: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    void this.feedback.run(() => this.refresh());
  }
  private currentStatusFilter(): ClinicalRecordStatus | '' {
    if (this.activeTab === 'in_review') return 'in_review';
    return this.statusFilter;
  }
  statusLabel(status: ClinicalRecordStatus) {
    return {
      pending: 'Processando',
      in_review: 'Em revisão',
      completed: 'Concluído',
      failed: 'Falha no processamento',
      cancelled: 'Cancelado',
    }[status];
  }
  async open(row: RecordRow) {
    await this.router.navigate(['/records', row.type, row.id, 'edit']);
  }
  async review(row: RecordRow) {
    await this.open(row);
  }
  canEdit(row: RecordRow) {
    return (
      this.auth.can('clinical_records.update') &&
      (this.auth.can('clinical_records.manage_all') || row.professional.id === this.auth.user()?.id)
    );
  }
  canCancel(row: RecordRow) {
    return (
      this.auth.can('clinical_records.cancel') &&
      (this.auth.can('clinical_records.manage_all') || row.professional.id === this.auth.user()?.id)
    );
  }
  async retry(processId: number) {
    await this.feedback.run(async () => {
      await this.service.retry(processId);
      this.feedback.success('Processamento retomado a partir do trecho pendente.');
      await this.refresh();
    });
  }
  requestCancellation(row: RecordRow) {
    if (!this.canCancel(row)) return;
    this.cancellationReason = '';
    this.cancelling.set(row);
  }
  closeCancellation() {
    this.cancelling.set(null);
    this.cancellationReason = '';
  }
  async confirmCancellation() {
    const row = this.cancelling();
    if (!row) return;
    const cancelled = await this.feedback.run(async () => {
      await this.service.cancel(row.type, row.id, this.cancellationReason);
      return true;
    });
    if (!cancelled) return;
    this.feedback.success(
      row.type === 'evolution' ? 'Evolução cancelada.' : 'Avaliação cancelada.',
    );
    this.closeCancellation();
    await this.refresh();
  }
  private schedulePoll() {
    this.pollTimer = window.setTimeout(
      () => void this.refresh().catch(() => this.schedulePoll()),
      10000,
    );
  }
}
