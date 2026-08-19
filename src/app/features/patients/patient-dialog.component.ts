import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';

@Component({
  selector: 'app-patient-dialog',
  imports: [FormsModule],
  templateUrl: './patient-dialog.component.html',
})
export class PatientDialogComponent {
  readonly patient = input<Patient | null>(null);
  readonly closed = output<void>();
  readonly saved = output<Patient>();
  readonly preview = signal('');
  form: Partial<Patient> = {};
  photo: File | null = null;

  constructor(
    private readonly patients: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly photos: PhotoCacheService,
  ) {
    effect(() => {
      const patient = this.patient();
      this.form = patient
        ? { ...patient }
        : {
            name: '',
            document: '',
            birth_date: '',
            phone: '',
            indication: '',
            birthplace: '',
            marital_status: '',
            gender: '',
            profession: '',
            address: '',
            email: '',
            notes: '',
          };
      this.photo = null;
      this.preview.set('');
    });
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.photo = file;
    this.preview.set(file ? URL.createObjectURL(file) : '');
  }
  existingPhoto() {
    const patient = this.patient();
    return patient ? this.photos.url('patient', patient.id, patient.has_photo) : '';
  }
  age() {
    if (!this.form.birth_date) return null;
    const birthDate = new Date(`${this.form.birth_date}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 ? age : null;
  }
  async save() {
    await this.feedback.run(async () => {
      const current = this.patient();
      const result = current
        ? await this.patients.update(current.id, this.form, this.photo)
        : await this.patients.create(this.form, this.photo);
      if (current) this.photos.invalidate('patient', current.id);
      this.feedback.success('Paciente salvo com sucesso.');
      this.saved.emit(result.data);
    });
  }
}
