import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AuthArtComponent } from '../../shared/auth-art/auth-art.component';

type RecoveryStep = 'email' | 'code' | 'password' | 'success';

@Component({
  selector: 'app-password-recovery-page',
  imports: [FormsModule, RouterLink, AuthArtComponent],
  templateUrl: './password-recovery-page.component.html',
})
export class PasswordRecoveryPageComponent {
  readonly step = signal<RecoveryStep>('email');
  readonly form = {
    email: '',
    website: '',
    code: '',
    password: '',
    passwordConfirmation: '',
  };

  private resetToken = '';

  constructor(
    private readonly auth: AuthService,
    private readonly feedback: FeedbackService,
  ) {}

  async requestCode(isResend = false): Promise<void> {
    const result = await this.feedback.run(() =>
      this.auth.requestPasswordRecoveryCode(this.form.email, this.form.website),
    );
    if (!result) return;

    this.form.code = '';
    this.step.set('code');
    this.feedback.success(isResend ? 'Enviamos um novo código para o seu e-mail.' : result.message);
  }

  async verifyCode(): Promise<void> {
    const result = await this.feedback.run(() =>
      this.auth.verifyPasswordRecoveryCode(this.form.email, this.form.code),
    );
    if (!result) return;

    this.form.email = result.data.email;
    this.resetToken = result.data.reset_token;
    this.step.set('password');
    this.feedback.success('Código validado. Agora defina sua nova senha.');
  }

  async redefinePassword(): Promise<void> {
    if (this.form.password !== this.form.passwordConfirmation) {
      this.feedback.failure('As senhas informadas não coincidem.');
      return;
    }

    const result = await this.feedback.run(() =>
      this.auth.resetPassword(
        this.form.email,
        this.resetToken,
        this.form.password,
        this.form.passwordConfirmation,
      ),
    );
    if (!result) return;

    this.resetToken = '';
    this.form.code = '';
    this.form.password = '';
    this.form.passwordConfirmation = '';
    this.step.set('success');
  }

  editEmail(): void {
    this.resetToken = '';
    this.form.code = '';
    this.step.set('email');
  }

  sanitizeCode(): void {
    this.form.code = this.form.code.replace(/\D/g, '').slice(0, 6);
  }
}
