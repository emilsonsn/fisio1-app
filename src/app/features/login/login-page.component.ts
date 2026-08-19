import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FeedbackService } from '../../core/ui/feedback.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  readonly login = { email: 'andre@fisio1.com.br', password: 'andre' };
  constructor(
    private readonly auth: AuthService,
    private readonly feedback: FeedbackService,
    private readonly router: Router,
  ) {}
  async signIn() {
    await this.feedback.run(async () => {
      await this.auth.login(this.login.email, this.login.password);
      await this.router.navigateByUrl('/');
    });
  }
  async requestReset() {
    await this.feedback.run(async () =>
      this.feedback.success((await this.auth.forgotPassword(this.login.email)).message),
    );
  }
}
