import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClinicalRecordsService } from '../../core/clinical-records/clinical-records.service';
import { Assessment, Evolution, Patient } from '../../core/models';
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
  form: ClinicalRecordForm = emptyClinicalRecordForm();
  files: File[] = [];
  private reviewingId: number | null = null;
  constructor(
    private readonly records: ClinicalRecordsService,
    private readonly patientsService: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly route: ActivatedRoute,
    readonly router: Router,
  ) {}
  async ngOnInit() {
    await this.feedback.run(async () => {
      this.patients.set((await this.patientsService.list()).data);
      const patientId = Number(this.route.snapshot.queryParamMap.get('patient') ?? 0);
      const reviewId = Number(this.route.snapshot.queryParamMap.get('id') ?? 0);
      const type = this.route.snapshot.queryParamMap.get('type') as RecordType | null;
      if (reviewId && type) await this.loadReview(type, reviewId);
      else this.form.patient_id = patientId;
    });
  }
  continueToAudio() {
    if (!this.form.patient_id) {
      this.feedback.error.set('Selecione um paciente para continuar.');
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
    if (!this.reviewingId) return;
    await this.feedback.run(async () => {
      const payload =
        this.form.type === 'evolution'
          ? { ...this.form, evolved_at: this.form.performed_at }
          : { ...this.form, assessed_at: this.form.performed_at };
      if (this.form.type === 'evolution')
        await this.records.confirmEvolution(this.reviewingId!, payload, this.files);
      else await this.records.confirmAssessment(this.reviewingId!, payload, this.files);
      this.feedback.success('Registro revisado e concluído com sucesso.');
      await this.router.navigateByUrl('/records');
    });
  }
  patientName() {
    return this.patients().find((patient) => patient.id === this.form.patient_id)?.name ?? '';
  }
  private async loadReview(type: RecordType, id: number) {
    const record =
      type === 'evolution'
        ? (await this.records.evolution(id)).data
        : (await this.records.assessment(id)).data;
    if (record.status !== 'in_review') {
      await this.router.navigateByUrl('/records');
      return;
    }
    this.reviewingId = id;
    this.form = {
      ...this.form,
      ...record,
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
