import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PasswordRecoveryPageComponent } from './password-recovery-page.component';

class AuthServiceStub {
  requestPasswordRecoveryCode = vi
    .fn()
    .mockResolvedValue({ message: 'Código enviado com segurança.' });
  verifyPasswordRecoveryCode = vi.fn().mockResolvedValue({
    data: { email: 'profissional@fisio1.com.br', reset_token: 'reset-token', expires_in: 3600 },
  });
  resetPassword = vi.fn().mockResolvedValue({ message: 'Senha redefinida.' });
}

class FeedbackServiceStub {
  readonly error = signal('');
  readonly messages: string[] = [];

  async run<T>(task: () => Promise<T>): Promise<T | undefined> {
    try {
      return await task();
    } catch {
      return undefined;
    }
  }

  success(message: string): void {
    this.messages.push(message);
  }

  failure(message: string): void {
    this.error.set(message);
  }
}

describe('PasswordRecoveryPageComponent', () => {
  let fixture: ComponentFixture<PasswordRecoveryPageComponent>;
  let component: PasswordRecoveryPageComponent;
  let auth: AuthServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordRecoveryPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FeedbackService, useClass: FeedbackServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordRecoveryPageComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  it('completes the code, token and new password flow', async () => {
    component.form.email = 'profissional@fisio1.com.br';

    await component.requestCode();
    expect(component.step()).toBe('code');
    expect(auth.requestPasswordRecoveryCode).toHaveBeenCalledWith('profissional@fisio1.com.br', '');

    component.form.code = '123456';
    await component.verifyCode();
    expect(component.step()).toBe('password');
    expect(auth.verifyPasswordRecoveryCode).toHaveBeenCalledWith(
      'profissional@fisio1.com.br',
      '123456',
    );

    component.form.password = 'nova-senha';
    component.form.passwordConfirmation = 'nova-senha';
    await component.redefinePassword();
    expect(component.step()).toBe('success');
    expect(auth.resetPassword).toHaveBeenCalledWith(
      'profissional@fisio1.com.br',
      'reset-token',
      'nova-senha',
      'nova-senha',
    );
  });

  it('does not submit when password confirmation differs', async () => {
    component.form.password = 'senha-um';
    component.form.passwordConfirmation = 'senha-dois';

    await component.redefinePassword();

    expect(auth.resetPassword).not.toHaveBeenCalled();
    expect((TestBed.inject(FeedbackService) as unknown as FeedbackServiceStub).error()).toContain(
      'não coincidem',
    );
  });
});
