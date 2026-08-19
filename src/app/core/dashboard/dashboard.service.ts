import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { DashboardData } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly data = signal<DashboardData>({
    active_patients: 0,
    initial_assessments: 0,
    records_this_month: 0,
    pending_records: 0,
    recent_records: [],
  });
  constructor(private readonly http: HttpClient) {}
  async load(): Promise<DashboardData> {
    const data = (
      await firstValueFrom(this.http.get<{ data: DashboardData }>(`${API_URL}/dashboard`))
    ).data;
    this.data.set(data);
    return data;
  }
}
