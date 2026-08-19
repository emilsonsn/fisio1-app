import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { PatientDialogComponent } from './patient-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patients-page',
  imports: [RouterLink, AvatarComponent, PatientDialogComponent],
  templateUrl: './patients-page.component.html',
})
export class PatientsPageComponent implements OnInit, OnDestroy {
  readonly patients = signal<Patient[]>([]);
  readonly dialogOpen = signal(false);
  readonly editing = signal<Patient | null>(null);
  private querySubscription?: Subscription;
  constructor(
    private readonly service: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly route: ActivatedRoute,
  ) {}
  ngOnInit() {
    this.querySubscription = this.route.queryParamMap.subscribe(
      (params) => void this.search(params.get('search') ?? ''),
    );
  }
  ngOnDestroy() {
    this.querySubscription?.unsubscribe();
  }
  async search(term: string) {
    await this.feedback.run(async () => this.patients.set((await this.service.list(term)).data));
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
    void this.search('');
  }
  async pdf(patient: Patient) {
    await this.feedback.run(async () => {
      const url = URL.createObjectURL(await this.service.historyPdf(patient.id));
      const link = document.createElement('a');
      link.href = url;
      link.download = `historico-${patient.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}
