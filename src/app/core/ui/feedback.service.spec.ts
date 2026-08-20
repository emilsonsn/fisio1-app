import { HttpErrorResponse } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new FeedbackService();
  });

  afterEach(() => vi.useRealTimers());

  it('uses the backend message before validation and removes the error automatically', async () => {
    const request = service.run(() =>
      Promise.reject(
        new HttpErrorResponse({
          status: 401,
          error: {
            message: 'Credenciais inválidas.',
            errors: { email: ['O e-mail informado é inválido.'] },
          },
        }),
      ),
    );

    await vi.advanceTimersByTimeAsync(350);
    await request;
    expect(service.error()).toBe('Credenciais inválidas.');

    await vi.advanceTimersByTimeAsync(4650);
    expect(service.error()).toBe('');
  });

  it('reads a JSON response returned as text', async () => {
    const request = service.run(() =>
      Promise.reject(
        new HttpErrorResponse({
          status: 422,
          error: JSON.stringify({ message: 'Não foi possível salvar o registro.' }),
        }),
      ),
    );

    await vi.advanceTimersByTimeAsync(350);
    await request;
    expect(service.error()).toBe('Não foi possível salvar o registro.');
  });

  it('removes success messages automatically without an older timer clearing a newer toast', async () => {
    service.success('Primeira mensagem');
    await vi.advanceTimersByTimeAsync(2000);
    service.success('Segunda mensagem');
    await vi.advanceTimersByTimeAsync(1500);

    expect(service.message()).toBe('Segunda mensagem');

    await vi.advanceTimersByTimeAsync(2000);
    expect(service.message()).toBe('');
  });
});
