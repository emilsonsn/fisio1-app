import { Injectable, signal } from '@angular/core';
import { PatientsService } from '../patients/patients.service';
import { UsersService } from '../users/users.service';

@Injectable({ providedIn: 'root' })
export class PhotoCacheService {
  readonly urls = signal<Record<string, string>>({});
  private readonly loading = new Set<string>();

  constructor(
    private readonly patients: PatientsService,
    private readonly users: UsersService,
  ) {}

  url(type: 'patient' | 'user', id: number, hasPhoto: boolean): string {
    const key = `${type}:${id}`;
    const cached = this.urls()[key];
    if (!cached && hasPhoto && !this.loading.has(key)) void this.load(type, id, key);
    return cached ?? '';
  }

  invalidate(type: 'patient' | 'user', id: number): void {
    const key = `${type}:${id}`;
    const current = this.urls()[key];
    if (current) URL.revokeObjectURL(current);
    this.urls.update((urls) => {
      const next = { ...urls };
      delete next[key];
      return next;
    });
  }

  private async load(type: 'patient' | 'user', id: number, key: string): Promise<void> {
    this.loading.add(key);
    try {
      const blob = type === 'patient' ? await this.patients.photo(id) : await this.users.photo(id);
      this.urls.update((urls) => ({ ...urls, [key]: URL.createObjectURL(blob) }));
    } catch {
      // Keep initials when the image is unavailable.
    } finally {
      this.loading.delete(key);
    }
  }
}
