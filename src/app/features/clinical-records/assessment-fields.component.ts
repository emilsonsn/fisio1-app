import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClinicalRecordForm } from './clinical-record-form.model';

@Component({
  selector: 'app-assessment-fields',
  imports: [FormsModule],
  templateUrl: './assessment-fields.component.html',
  styleUrl: './assessment-fields.component.scss',
})
export class AssessmentFieldsComponent {
  @Input({ required: true }) form!: ClinicalRecordForm;
}
