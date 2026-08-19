import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { toFormData } from '../form-data';
import { ApiCollection, Assessment, Evolution } from '../models';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordsService {
  constructor(private readonly http: HttpClient) {}
  assessments() {
    return firstValueFrom(this.http.get<ApiCollection<Assessment>>(`${API_URL}/assessments`));
  }
  evolutions() {
    return firstValueFrom(this.http.get<ApiCollection<Evolution>>(`${API_URL}/evolutions`));
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
}
