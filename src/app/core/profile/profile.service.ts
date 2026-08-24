import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { toFormData } from '../form-data';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}
  update(payload: { name: string }, photo?: File | null) {
    const form = toFormData(payload, photo ? [photo] : [], 'photo');
    form.append('_method', 'PATCH');
    return firstValueFrom(this.http.post<{ data: User }>(`${API_URL}/profile`, form));
  }
  updatePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return firstValueFrom(
      this.http.put<{ message: string }>(`${API_URL}/profile/password`, payload),
    );
  }
  photo() {
    return firstValueFrom(this.http.get(`${API_URL}/profile/photo`, { responseType: 'blob' }));
  }
}
