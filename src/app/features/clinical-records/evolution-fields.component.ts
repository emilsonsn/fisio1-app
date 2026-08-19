import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClinicalRecordForm } from './clinical-record-form.model';

@Component({
  selector: 'app-evolution-fields',
  imports: [FormsModule],
  templateUrl: './evolution-fields.component.html',
})
export class EvolutionFieldsComponent {
  @Input({ required: true }) form!: ClinicalRecordForm;
}
