import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { AccessGroup, ApiCollection, Permission } from '../models';

@Injectable({ providedIn: 'root' })
export class AccessGroupsService {
  constructor(private readonly http: HttpClient) {}
  list() {
    return firstValueFrom(this.http.get<ApiCollection<AccessGroup>>(`${API_URL}/groups`));
  }
  permissions() {
    return firstValueFrom(this.http.get<{ data: Permission[] }>(`${API_URL}/permissions`));
  }
  create(payload: object) {
    return firstValueFrom(this.http.post<{ data: AccessGroup }>(`${API_URL}/groups`, payload));
  }
  update(id: number, payload: object) {
    return firstValueFrom(
      this.http.patch<{ data: AccessGroup }>(`${API_URL}/groups/${id}`, payload),
    );
  }
}
