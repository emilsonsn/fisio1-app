import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClinicalRecordsService } from '../../core/clinical-records/clinical-records.service';
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
import { ClinicalRecordDialogComponent } from './clinical-record-dialog.component';

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
  imports: [FormsModule, AvatarComponent, ClinicalRecordDialogComponent],
  templateUrl: './clinical-records-page.component.html',
})
export class ClinicalRecordsPageComponent implements OnInit, OnDestroy {
  readonly assessments = signal<Assessment[]>([]);
  readonly evolutions = signal<Evolution[]>([]);
  readonly selected = signal<Assessment | Evolution | null>(null);
  readonly selectedType = signal<'initial_assessment' | 'evolution'>('initial_assessment');
  search = '';
  typeFilter = 'all';
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
    }[status];
  }
  async open(row: RecordRow) {
    const record =
      row.type === 'evolution'
        ? (await this.service.evolution(row.id)).data
        : (await this.service.assessment(row.id)).data;
    this.selectedType.set(row.type);
    this.selected.set(record);
  }
  async review(row: RecordRow) {
    await this.router.navigate(['/new-record'], { queryParams: { type: row.type, id: row.id } });
  }
  async retry(processId: number) {
    await this.feedback.run(async () => {
      await this.service.retry(processId);
      this.feedback.success('Processamento retomado a partir do trecho pendente.');
      await this.refresh();
    });
  }
  async detailChanged() {
    const current = this.selected();
    if (!current) return;
    const type = this.selectedType();
    this.selected.set(
      type === 'evolution'
        ? (await this.service.evolution(current.id)).data
        : (await this.service.assessment(current.id)).data,
    );
    await this.refresh();
  }
  private schedulePoll() {
    this.pollTimer = window.setTimeout(
      () => void this.refresh().catch(() => this.schedulePoll()),
      10000,
    );
  }
}
