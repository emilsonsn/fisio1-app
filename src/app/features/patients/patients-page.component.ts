import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';
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
  readonly pendingDeletion = signal<Patient | null>(null);
  readonly currentSearch = signal('');
  private querySubscription?: Subscription;
  constructor(
    private readonly service: PatientsService,
    private readonly feedback: FeedbackService,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly photos: PhotoCacheService,
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
    this.currentSearch.set(term);
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
    void this.search(this.currentSearch());
  }
  canDelete(): boolean {
    return this.auth.can('patients.delete');
  }
  requestDeletion(patient: Patient) {
    this.pendingDeletion.set(patient);
  }
  cancelDeletion() {
    this.pendingDeletion.set(null);
  }
  async confirmDeletion() {
    const patient = this.pendingDeletion();
    if (!patient) return;

    const deleted = await this.feedback.run(async () => {
      await this.service.delete(patient.id);
      return true;
    });
    if (!deleted) return;

    this.photos.invalidate('patient', patient.id);
    this.pendingDeletion.set(null);
    this.feedback.success('Paciente excluído com sucesso.');
    await this.search(this.currentSearch());
  }
}
