import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { ApiCollection, AuditLog, AuditLogFilters, AuditLogOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: AuditLogFilters, page = 1) {
    let params = new HttpParams().set('page', page).set('per_page', 20);

    filters.events.forEach((event) => (params = params.append('events[]', event)));
    if (filters.user_id) params = params.set('user_id', filters.user_id);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);

    return firstValueFrom(
      this.http.get<ApiCollection<AuditLog>>(`${API_URL}/audit-logs`, { params }),
    );
  }

  options() {
    return firstValueFrom(
      this.http.get<{ data: AuditLogOptions }>(`${API_URL}/audit-logs/options`),
    );
  }
}
