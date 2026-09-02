import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { toFormData } from '../form-data';
import { ApiCollection, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}
  query(search = '', page = 1, perPage = 15) {
    return this.http.get<ApiCollection<User>>(`${API_URL}/users`, {
      params: new HttpParams().set('search', search).set('page', page).set('per_page', perPage),
    });
  }
  list(search = '', page = 1, perPage = 15) {
    return firstValueFrom(this.query(search, page, perPage));
  }
  create(payload: object, photo?: File | null) {
    return firstValueFrom(
      this.http.post<{ data: User }>(
        `${API_URL}/users`,
        toFormData(payload, photo ? [photo] : [], 'photo'),
      ),
    );
  }
  update(id: number, payload: object, photo?: File | null) {
    const form = toFormData(payload, photo ? [photo] : [], 'photo');
    form.append('_method', 'PATCH');
    return firstValueFrom(this.http.post<{ data: User }>(`${API_URL}/users/${id}`, form));
  }
  photo(id: number) {
    return firstValueFrom(this.http.get(`${API_URL}/users/${id}/photo`, { responseType: 'blob' }));
  }
}
