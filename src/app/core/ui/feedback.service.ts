import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

const SUCCESS_DURATION_MS = 3500;
const ERROR_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  private pending = 0;
  private successTimer?: ReturnType<typeof window.setTimeout>;
  private errorTimer?: ReturnType<typeof window.setTimeout>;

  async run<T>(task: () => Promise<T>): Promise<T | undefined> {
    const startedAt = performance.now();
    this.pending += 1;
    this.loading.set(true);
    this.dismissError();
    try {
      return await task();
    } catch (error: unknown) {
      this.failure(error);
      return undefined;
    } finally {
      const remaining = 350 - (performance.now() - startedAt);
      if (remaining > 0)
        await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
      this.pending -= 1;
      this.loading.set(this.pending > 0);
    }
  }

  success(message: string): void {
    this.dismissError();
    if (this.successTimer) window.clearTimeout(this.successTimer);
    this.message.set(message);
    this.successTimer = window.setTimeout(() => this.dismissSuccess(), SUCCESS_DURATION_MS);
  }

  failure(error: unknown): void {
    this.dismissSuccess();
    if (this.errorTimer) window.clearTimeout(this.errorTimer);
    this.error.set(typeof error === 'string' ? error : this.errorMessage(error));
    this.errorTimer = window.setTimeout(() => this.dismissError(), ERROR_DURATION_MS);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = this.parsePayload(error.error);
      const backendMessage = this.stringProperty(payload, 'message');
      if (backendMessage) return backendMessage;

      const validationMessage = this.firstValidationMessage(payload);
      if (validationMessage) return validationMessage;

      if (error.status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
      }
    }

    if (error instanceof Error && error.message) return error.message;

    const payload = this.parsePayload(error);

    return this.stringProperty(payload, 'message') ?? 'Não foi possível concluir a ação.';
  }

  private parsePayload(payload: unknown): unknown {
    if (typeof payload !== 'string') return payload;

    try {
      return JSON.parse(payload) as unknown;
    } catch {
      return payload.trim() && !payload.trim().startsWith('<') ? { message: payload.trim() } : null;
    }
  }

  private stringProperty(payload: unknown, property: string): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const value = (payload as Record<string, unknown>)[property];

    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private firstValidationMessage(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const errors = (payload as Record<string, unknown>)['errors'];
    if (!errors || typeof errors !== 'object') return undefined;

    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (Array.isArray(value)) {
        const message = value.find(
          (item): item is string => typeof item === 'string' && Boolean(item.trim()),
        );
        if (message) return message.trim();
      }
    }

    return undefined;
  }

  private dismissSuccess(): void {
    if (this.successTimer) window.clearTimeout(this.successTimer);
    this.successTimer = undefined;
    this.message.set('');
  }

  private dismissError(): void {
    if (this.errorTimer) window.clearTimeout(this.errorTimer);
    this.errorTimer = undefined;
    this.error.set('');
  }
}
