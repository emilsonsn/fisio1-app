import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api-url';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);

  constructor(private readonly http: HttpClient) {}

  async login(email: string, password: string): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<{ data: { user: User; token: string } }>(`${API_URL}/auth/login`, {
        email,
        password,
        device_name: 'fisio1-angular',
      }),
    );
    sessionStorage.setItem('fisio1-token', response.data.token);
    this.user.set(response.data.user);
    return response.data.user;
  }

  async restore(): Promise<boolean> {
    if (!sessionStorage.getItem('fisio1-token')) return false;
    try {
      this.user.set(
        (await firstValueFrom(this.http.get<{ data: User }>(`${API_URL}/auth/me`))).data,
      );
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  requestPasswordRecoveryCode(email: string, website = '') {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${API_URL}/auth/forgot-password`, { email, website }),
    );
  }

  verifyPasswordRecoveryCode(email: string, code: string) {
    return firstValueFrom(
      this.http.post<{
        data: { email: string; reset_token: string; expires_in: number };
      }>(`${API_URL}/auth/forgot-password/verify`, { email, code }),
    );
  }

  resetPassword(email: string, token: string, password: string, passwordConfirmation: string) {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${API_URL}/auth/reset-password`, {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, {}));
    } finally {
      this.clear();
    }
  }

  can(permission: string): boolean {
    return this.user()?.permissions?.includes(permission) ?? false;
  }

  private clear(): void {
    sessionStorage.removeItem('fisio1-token');
    this.user.set(null);
  }
}
