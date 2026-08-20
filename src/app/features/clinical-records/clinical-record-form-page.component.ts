import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ClinicalRecordsService } from '../../core/clinical-records/clinical-records.service';
import {
  Assessment,
  ClinicalRecordStatus,
  Evolution,
  Patient,
  RecordAttachment,
} from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AudioRecorderStepComponent } from './audio-recorder-step.component';
import { AssessmentFieldsComponent } from './assessment-fields.component';
import {
  ClinicalRecordForm,
  emptyClinicalRecordForm,
  RecordType,
} from './clinical-record-form.model';
import { EvolutionFieldsComponent } from './evolution-fields.component';

@Component({
  selector: 'app-clinical-record-form-page',
  imports: [
    FormsModule,
    RouterLink,
    AudioRecorderStepComponent,
    AssessmentFieldsComponent,
    EvolutionFieldsComponent,
  ],
  templateUrl: './clinical-record-form-page.component.html',
})
export class ClinicalRecordFormPageComponent implements OnInit {
  readonly patients = signal<Patient[]>([]);
  readonly step = signal<1 | 2 | 3 | 4>(1);
  readonly recordStatus = signal<ClinicalRecordStatus | null>(null);
  readonly attachments = signal<RecordAttachment[]>([]);
  readonly savedCancellationReason = signal<string | null>(null);
  readonly canEditRecord = signal(false);
  form: ClinicalRecordForm = emptyClinicalRecordForm();
  files: File[] = [];
  private recordId: number | null = null;
  constructor(
    private readonly records: ClinicalRecordsService,
    private readonly patientsService: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    readonly router: Router,
  ) {}
  async ngOnInit() {
    await this.feedback.run(async () => {
      this.patients.set((await this.patientsService.list()).data);
      const patientId = Number(this.route.snapshot.queryParamMap.get('patient') ?? 0);
      const recordId = Number(
        this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('id') ?? 0,
      );
      const typeParameter =
        this.route.snapshot.paramMap.get('type') ?? this.route.snapshot.queryParamMap.get('type');
      const type: RecordType | null =
        typeParameter === 'initial_assessment' || typeParameter === 'evolution'
          ? typeParameter
          : null;
      if (recordId && type) await this.loadRecord(type, recordId);
      else this.form.patient_id = patientId;
    });
  }
  continueToAudio() {
    if (!this.form.patient_id) {
      this.feedback.failure('Selecione um paciente para continuar.');
      return;
    }
    this.step.set(2);
  }
  onFiles(event: Event) {
    this.files = Array.from((event.target as HTMLInputElement).files ?? []);
  }
  async processAudio(audio: File) {
    this.step.set(3);
    const result = await this.feedback.run(async () => {
      const data = new FormData();
      data.append('patient_id', String(this.form.patient_id));
      data.append('type', this.form.type);
      data.append('performed_at', this.form.performed_at);
      data.append('audio', audio);
      await this.records.processAudio(data);
      this.feedback.success('Registro criado. A IA continuará em segundo plano.');
      await this.router.navigateByUrl('/records');
    });
    if (result === undefined && this.feedback.error()) this.step.set(2);
  }
  async save() {
    if (!this.recordId || this.isReadOnly()) return;
    const recordId = this.recordId;
    await this.feedback.run(async () => {
      const payload =
        this.form.type === 'evolution'
          ? { ...this.form, evolved_at: this.form.performed_at }
          : { ...this.form, assessed_at: this.form.performed_at };
      const isReview = this.recordStatus() === 'in_review';
      if (this.form.type === 'evolution') {
        if (isReview) await this.records.confirmEvolution(recordId, payload, this.files);
        else await this.records.updateEvolution(recordId, payload, this.files);
      } else if (isReview) {
        await this.records.confirmAssessment(recordId, payload, this.files);
      } else {
        await this.records.updateAssessment(recordId, payload, this.files);
      }
      this.feedback.success(
        isReview
          ? 'Registro revisado e concluído com sucesso.'
          : 'Registro atualizado com sucesso.',
      );
      await this.router.navigateByUrl('/records');
    });
  }
  isCancelled() {
    return this.recordStatus() === 'cancelled';
  }
  isCompleted() {
    return this.recordStatus() === 'completed';
  }
  isReadOnly() {
    return this.isCancelled() || !this.canEditRecord();
  }
  async removeAttachment(id: number) {
    if (this.isReadOnly()) return;
    const removed = await this.feedback.run(async () => {
      await this.records.deleteAttachment(id);
      return true;
    });
    if (!removed) return;
    this.attachments.update((attachments) =>
      attachments.filter((attachment) => attachment.id !== id),
    );
    this.feedback.success('Anexo removido.');
  }
  async downloadAttachment(attachment: RecordAttachment) {
    await this.feedback.run(async () => {
      const url = URL.createObjectURL(await this.records.downloadAttachment(attachment.id));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
  patientName() {
    return this.patients().find((patient) => patient.id === this.form.patient_id)?.name ?? '';
  }
  private async loadRecord(type: RecordType, id: number) {
    const record =
      type === 'evolution'
        ? (await this.records.evolution(id)).data
        : (await this.records.assessment(id)).data;
    if (!['in_review', 'completed', 'cancelled'].includes(record.status)) {
      await this.router.navigateByUrl('/records');
      return;
    }
    this.recordId = id;
    this.recordStatus.set(record.status);
    this.attachments.set(record.attachments);
    this.savedCancellationReason.set(record.cancellation_reason);
    this.canEditRecord.set(
      this.auth.can('clinical_records.update') &&
        (this.auth.can('clinical_records.manage_all') ||
          record.professional_id === this.auth.user()?.id),
    );
    const form = emptyClinicalRecordForm();
    const formValues = form as unknown as Record<string, unknown>;
    const recordValues = record as unknown as Record<string, unknown>;
    Object.keys(formValues).forEach((field) => {
      if (field in recordValues) formValues[field] = recordValues[field];
    });
    this.form = {
      ...form,
      patient_id: record.patient_id,
      type,
      performed_at:
        type === 'evolution'
          ? (record as Evolution).evolved_at
          : (record as Assessment).assessed_at,
    };
    this.step.set(4);
  }
}
