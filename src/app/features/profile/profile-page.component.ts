import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent {
  readonly preview = signal('');
  photo: File | null = null;
  form: { name: string };
  passwordForm = { current_password: '', password: '', password_confirmation: '' };

  constructor(
    readonly auth: AuthService,
    private readonly profile: ProfileService,
    private readonly feedback: FeedbackService,
    private readonly photos: PhotoCacheService,
  ) {
    this.form = { name: this.auth.user()?.name ?? '' };
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.photo = file;
    this.preview.set(file ? URL.createObjectURL(file) : '');
  }

  currentPhoto() {
    const user = this.auth.user();
    return user ? this.photos.url('user', user.id, user.has_photo) : '';
  }

  passwordsMismatch() {
    const { password, password_confirmation: confirmation } = this.passwordForm;
    return password.length > 0 && confirmation.length > 0 && password !== confirmation;
  }

  async saveProfile() {
    await this.feedback.run(async () => {
      const response = await this.profile.update(this.form, this.photo);
      const user = this.auth.user();
      if (user) this.photos.invalidate('user', user.id);
      this.auth.updateUser(response.data);
      this.photo = null;
      this.preview.set('');
      this.feedback.success('Perfil atualizado.');
    });
  }

  async savePassword() {
    await this.feedback.run(async () => {
      await this.profile.updatePassword(this.passwordForm);
      this.passwordForm = { current_password: '', password: '', password_confirmation: '' };
      this.feedback.success('Senha atualizada.');
    });
  }
}
