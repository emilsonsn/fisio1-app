import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { toFormData } from '../form-data';
import { ApiCollection, Patient } from '../models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private readonly http: HttpClient) {}
  list(search = '') {
    return firstValueFrom(
      this.http.get<ApiCollection<Patient>>(`${API_URL}/patients`, {
        params: new HttpParams().set('search', search),
      }),
    );
  }
  create(payload: Partial<Patient>, photo?: File | null) {
    return firstValueFrom(
      this.http.post<{ data: Patient }>(`${API_URL}/patients`, this.form(payload, photo)),
    );
  }
  update(id: number, payload: Partial<Patient>, photo?: File | null) {
    const form = this.form(payload, photo);
    form.append('_method', 'PATCH');
    return firstValueFrom(this.http.post<{ data: Patient }>(`${API_URL}/patients/${id}`, form));
  }
  photo(id: number) {
    return firstValueFrom(
      this.http.get(`${API_URL}/patients/${id}/photo`, { responseType: 'blob' }),
    );
  }
  historyPdf(id: number) {
    return firstValueFrom(
      this.http.get(`${API_URL}/patients/${id}/history.pdf`, { responseType: 'blob' }),
    );
  }
  private form(payload: Partial<Patient>, photo?: File | null) {
    const allowed = [
      'name',
      'document',
      'birth_date',
      'phone',
      'indication',
      'birthplace',
      'marital_status',
      'gender',
      'profession',
      'address',
      'email',
      'notes',
    ] as const;
    const sanitized = Object.fromEntries(allowed.map((key) => [key, payload[key]]));
    return toFormData(sanitized, photo ? [photo] : [], 'photo');
  }
}
