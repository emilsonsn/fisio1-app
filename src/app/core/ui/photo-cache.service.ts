import { Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { PatientsService } from '../patients/patients.service';
import { ProfileService } from '../profile/profile.service';
import { UsersService } from '../users/users.service';

@Injectable({ providedIn: 'root' })
export class PhotoCacheService {
  readonly urls = signal<Record<string, string>>({});
  private readonly loading = new Set<string>();

  constructor(
    private readonly patients: PatientsService,
    private readonly users: UsersService,
    private readonly profile: ProfileService,
    private readonly auth: AuthService,
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
      const blob = await this.fetch(type, id);
      this.urls.update((urls) => ({ ...urls, [key]: URL.createObjectURL(blob) }));
    } catch {
      // Keep initials when the image is unavailable.
    } finally {
      this.loading.delete(key);
    }
  }

  private fetch(type: 'patient' | 'user', id: number): Promise<Blob> {
    if (type === 'patient') return this.patients.photo(id);
    if (id === this.auth.user()?.id) return this.profile.photo();

    return this.users.photo(id);
  }
}
