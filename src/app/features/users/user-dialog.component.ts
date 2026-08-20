import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessGroup, User } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';
import { UsersService } from '../../core/users/users.service';

@Component({
  selector: 'app-user-dialog',
  imports: [FormsModule],
  templateUrl: './user-dialog.component.html',
})
export class UserDialogComponent {
  readonly user = input<User | null>(null);
  readonly groups = input.required<AccessGroup[]>();
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly preview = signal('');
  form = { name: '', email: '', password: '', access_group_ids: [] as number[] };
  photo: File | null = null;
  constructor(
    private readonly users: UsersService,
    private readonly feedback: FeedbackService,
    private readonly photos: PhotoCacheService,
  ) {
    effect(() => {
      const user = this.user();
      this.form = user
        ? {
            name: user.name,
            email: user.email,
            password: '',
            access_group_ids: user.access_groups.map((group) => group.id),
          }
        : { name: '', email: '', password: '', access_group_ids: [] };
      this.photo = null;
      this.preview.set('');
    });
  }
  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.photo = file;
    this.preview.set(file ? URL.createObjectURL(file) : '');
  }
  existingPhoto() {
    const user = this.user();
    return user ? this.photos.url('user', user.id, user.has_photo) : '';
  }
  async save() {
    await this.feedback.run(async () => {
      const current = this.user();
      const payload = { ...this.form, ...(this.form.password ? {} : { password: undefined }) };
      if (current) {
        await this.users.update(current.id, payload, this.photo);
        this.photos.invalidate('user', current.id);
      } else {
        await this.users.create({ ...this.form, password: undefined }, this.photo);
      }
      this.feedback.success(
        current
          ? 'Usuário atualizado.'
          : 'Usuário criado. Os dados de acesso foram enviados por e-mail.',
      );
      this.saved.emit();
    });
  }
}
