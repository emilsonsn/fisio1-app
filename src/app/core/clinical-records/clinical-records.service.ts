import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { toFormData } from '../form-data';
import { ApiCollection, Assessment, ClinicalRecordStatus, Evolution } from '../models';

export interface ClinicalRecordListFilters {
  dateFrom?: string;
  dateTo?: string;
  patientId?: number | null;
  perPage?: number;
  search?: string;
  status?: ClinicalRecordStatus | '';
}

@Injectable({ providedIn: 'root' })
export class ClinicalRecordsService {
  constructor(private readonly http: HttpClient) {}
  assessments(filters: ClinicalRecordListFilters = {}) {
    return firstValueFrom(
      this.http.get<ApiCollection<Assessment>>(`${API_URL}/assessments`, {
        params: this.listParams(filters),
      }),
    );
  }
  evolutions(filters: ClinicalRecordListFilters = {}) {
    return firstValueFrom(
      this.http.get<ApiCollection<Evolution>>(`${API_URL}/evolutions`, {
        params: this.listParams(filters),
      }),
    );
  }
  assessment(id: number) {
    return firstValueFrom(this.http.get<{ data: Assessment }>(`${API_URL}/assessments/${id}`));
  }
  evolution(id: number) {
    return firstValueFrom(this.http.get<{ data: Evolution }>(`${API_URL}/evolutions/${id}`));
  }
  processAudio(form: FormData) {
    return firstValueFrom(
      this.http.post<{ data: Assessment | Evolution }>(
        `${API_URL}/clinical-ai/process-audio`,
        form,
      ),
    );
  }
  createAssessment(payload: object, files: File[] = []) {
    return firstValueFrom(
      this.http.post<{ data: Assessment }>(`${API_URL}/assessments`, toFormData(payload, files)),
    );
  }
  createEvolution(payload: object, files: File[] = []) {
    return firstValueFrom(
      this.http.post<{ data: Evolution }>(`${API_URL}/evolutions`, toFormData(payload, files)),
    );
  }
  confirmAssessment(id: number, payload: object, files: File[] = []) {
    return firstValueFrom(
      this.http.post<{ data: Assessment }>(
        `${API_URL}/assessments/${id}/confirm`,
        toFormData(payload, files),
      ),
    );
  }
  confirmEvolution(id: number, payload: object, files: File[] = []) {
    return firstValueFrom(
      this.http.post<{ data: Evolution }>(
        `${API_URL}/evolutions/${id}/confirm`,
        toFormData(payload, files),
      ),
    );
  }
  updateAssessment(id: number, payload: object, files: File[] = []) {
    const form = toFormData(payload, files);
    form.append('_method', 'PATCH');
    return firstValueFrom(
      this.http.post<{ data: Assessment }>(`${API_URL}/assessments/${id}`, form),
    );
  }
  updateEvolution(id: number, payload: object, files: File[] = []) {
    const form = toFormData(payload, files);
    form.append('_method', 'PATCH');
    return firstValueFrom(this.http.post<{ data: Evolution }>(`${API_URL}/evolutions/${id}`, form));
  }
  cancel(type: 'initial_assessment' | 'evolution', id: number, reason: string) {
    const resource = type === 'evolution' ? 'evolutions' : 'assessments';
    return firstValueFrom(
      this.http.post<{ data: Assessment | Evolution }>(`${API_URL}/${resource}/${id}/cancel`, {
        reason: reason.trim() || null,
      }),
    );
  }
  addAttachments(type: 'initial_assessment' | 'evolution', id: number, files: File[]) {
    const form = toFormData({}, files);
    form.append('_method', 'PATCH');
    return firstValueFrom(
      this.http.post<{ data: Assessment | Evolution }>(
        `${API_URL}/${type === 'evolution' ? 'evolutions' : 'assessments'}/${id}`,
        form,
      ),
    );
  }
  downloadAttachment(id: number) {
    return firstValueFrom(
      this.http.get(`${API_URL}/record-attachments/${id}/download`, { responseType: 'blob' }),
    );
  }
  deleteAttachment(id: number) {
    return firstValueFrom(this.http.delete(`${API_URL}/record-attachments/${id}`));
  }
  retry(processId: number) {
    return firstValueFrom(
      this.http.post<{ message: string }>(
        `${API_URL}/clinical-ai/processes/${processId}/retry`,
        {},
      ),
    );
  }
  private listParams(filters: ClinicalRecordListFilters): HttpParams {
    let params = new HttpParams();
    const search = filters.search?.trim();
    if (filters.dateFrom) params = params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params = params.set('date_to', filters.dateTo);
    if (filters.patientId) params = params.set('patient_id', filters.patientId);
    if (filters.perPage) params = params.set('per_page', filters.perPage);
    if (search) params = params.set('search', search);
    if (filters.status) params = params.set('status', filters.status);
    return params;
  }
}
