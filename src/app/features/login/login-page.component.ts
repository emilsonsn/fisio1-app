import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AuthArtComponent } from '../../shared/auth-art/auth-art.component';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, AuthArtComponent],
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
}
