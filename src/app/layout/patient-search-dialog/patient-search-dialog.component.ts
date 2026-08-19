import { Component, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-patient-search-dialog',
  imports: [AvatarComponent],
  templateUrl: './patient-search-dialog.component.html',
})
export class PatientSearchDialogComponent {
  readonly closed = output<void>();
  readonly results = signal<Patient[]>([]);
  query = '';
  constructor(
    private readonly patients: PatientsService,
    private readonly router: Router,
  ) {}
  async search(query: string) {
    this.query = query;
    this.results.set(query.trim().length < 2 ? [] : (await this.patients.list(query)).data);
  }
  async open(patient: Patient) {
    this.closed.emit();
    await this.router.navigate(['/patients'], { queryParams: { search: patient.name } });
  }
}
