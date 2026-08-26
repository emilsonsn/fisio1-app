import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { Patient } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AvatarComponent } from '../avatar/avatar.component';

interface PatientRequest {
  term: string;
  page: number;
  append: boolean;
}

@Component({
  selector: 'app-patient-select',
  imports: [FormsModule, NgSelectModule, AvatarComponent],
  templateUrl: './patient-select.component.html',
  styleUrl: './patient-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PatientSelectComponent),
      multi: true,
    },
  ],
})
export class PatientSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Output() readonly patientSelected = new EventEmitter<Patient | null>();
  @Input() readOnly = false;

  readonly patients = signal<Patient[]>([]);
  readonly loading = signal(false);
  readonly searchTerms = new Subject<string>();
  value: number | null = null;

  private currentTerm = '';
  private currentPage = 0;
  private lastPage = 1;
  private disabled = false;
  private readonly requests = new Subject<PatientRequest>();
  private readonly subscriptions = new Subscription();
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(
    private readonly patientsService: PatientsService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.requests
        .pipe(
          tap(() => this.loading.set(true)),
          switchMap((request) =>
            this.patientsService.query(request.term, request.page, 20).pipe(
              map((response) => ({ request, response })),
              catchError((error: unknown) => {
                this.feedback.failure(error);
                return of({ request, response: null });
              }),
            ),
          ),
        )
        .subscribe(({ request, response }) => {
          this.loading.set(false);
          if (!response || request.term !== this.currentTerm) return;

          const selected = this.patients().find((patient) => patient.id === this.value);
          const incoming = request.append ? [...this.patients(), ...response.data] : response.data;
          if (selected && !incoming.some((patient) => patient.id === selected.id)) {
            incoming.unshift(selected);
          }
          this.patients.set(
            incoming.filter(
              (patient, index, patients) =>
                patients.findIndex((candidate) => candidate.id === patient.id) === index,
            ),
          );
          this.currentPage = response.meta?.current_page ?? request.page;
          this.lastPage = response.meta?.last_page ?? 1;
        }),
    );
    this.subscriptions.add(
      this.searchTerms.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
        this.currentTerm = term.trim();
        this.requestPage(1, false);
      }),
    );
    this.requestPage(1, false);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  writeValue(value: number | null): void {
    this.value = value || null;
    if (this.value && !this.patients().some((patient) => patient.id === this.value)) {
      void this.loadSelectedPatient(this.value);
    }
  }

  registerOnChange(callback: (value: number | null) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  markTouched(): void {
    this.onTouched();
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  isDisabled(): boolean {
    return this.disabled || this.readOnly;
  }

  select(value: number | null): void {
    this.value = value || null;
    this.onChange(this.value);
    this.onTouched();
    this.patientSelected.emit(this.patients().find((patient) => patient.id === this.value) ?? null);
  }

  loadNextPage(): void {
    if (this.loading() || this.currentPage >= this.lastPage) return;
    this.requestPage(this.currentPage + 1, true);
  }

  private requestPage(page: number, append: boolean): void {
    this.requests.next({ term: this.currentTerm, page, append });
  }

  private async loadSelectedPatient(id: number): Promise<void> {
    try {
      const patient = (await this.patientsService.get(id)).data;
      if (this.value !== id) return;
      this.patients.update((patients) =>
        patients.some((candidate) => candidate.id === id) ? patients : [patient, ...patients],
      );
      this.patientSelected.emit(patient);
    } catch (error: unknown) {
      this.feedback.failure(error);
    }
  }
}
