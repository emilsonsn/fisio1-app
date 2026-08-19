import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(localStorage.getItem('fisio1-theme') === 'dark');

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    this.apply(!this.dark());
  }

  private apply(dark: boolean): void {
    this.dark.set(dark);
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
    localStorage.setItem('fisio1-theme', dark ? 'dark' : 'light');
  }
}
