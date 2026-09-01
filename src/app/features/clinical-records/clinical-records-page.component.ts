import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  imports: [FormsModule, AvatarComponent],
  templateUrl: './clinical-records-page.component.html',
})
export class ClinicalRecordsPageComponent implements OnInit, OnDestroy {
  readonly formatDate = formatDateBr;
  readonly assessments = signal<Assessment[]>([]);
  readonly evolutions = signal<Evolution[]>([]);
  readonly cancelling = signal<RecordRow | null>(null);
  search = '';
  typeFilter = 'all';
  cancellationReason = '';
  private pollTimer?: number;
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
    const term = this.search.trim().toLowerCase();
    return rows
      .filter(
        (row) =>
          (this.typeFilter === 'all' || row.type === this.typeFilter) &&
          (!term || row.patient.name.toLowerCase().includes(term)),
      )
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  }
  constructor(
    private readonly service: ClinicalRecordsService,
    private readonly feedback: FeedbackService,
    readonly auth: AuthService,
    readonly router: Router,
  ) {}
  ngOnInit() {
    void this.feedback.run(() => this.refresh());
  }
  ngOnDestroy() {
    window.clearTimeout(this.pollTimer);
  }
  async refresh() {
    const [assessments, evolutions] = await Promise.all([
      this.service.assessments(),
      this.service.evolutions(),
    ]);
    this.assessments.set(assessments.data);
    this.evolutions.set(evolutions.data);
    window.clearTimeout(this.pollTimer);
    if ([...assessments.data, ...evolutions.data].some((record) => record.status === 'pending'))
      this.pollTimer = window.setTimeout(
        () => void this.refresh().catch(() => this.schedulePoll()),
        5000,
      );
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
