import { Component, input } from '@angular/core';
import { PhotoCacheService } from '../../core/ui/photo-cache.service';

@Component({
  selector: 'app-avatar',
  template: `<span class="avatar patient-avatar">
    @if (photo()) {
      <img [src]="photo()" [alt]="name()" />
    } @else {
      {{ initials() }}
    }
  </span>`,
})
export class AvatarComponent {
  readonly id = input.required<number>();
  readonly name = input.required<string>();
  readonly hasPhoto = input(false);
  readonly type = input<'patient' | 'user'>('patient');
  constructor(private readonly photos: PhotoCacheService) {}
  photo() {
    return this.photos.url(this.type(), this.id(), this.hasPhoto());
  }
  initials() {
    return this.name().slice(0, 2).toUpperCase();
  }
}
