import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  private pending = 0;

  async run<T>(task: () => Promise<T>): Promise<T | undefined> {
    const startedAt = performance.now();
    this.pending += 1;
    this.loading.set(true);
    this.error.set('');
    try {
      return await task();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
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
    this.message.set(message);
    window.setTimeout(() => this.message.set(''), 3500);
  }
}
