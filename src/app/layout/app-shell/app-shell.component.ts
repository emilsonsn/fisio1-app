import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../core/dashboard/dashboard.service';
import { ThemeService } from '../../core/ui/theme.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { PatientSearchDialogComponent } from '../patient-search-dialog/patient-search-dialog.component';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    PatientSearchDialogComponent,
  ],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit {
  readonly searchOpen = signal(false);
  constructor(
    readonly auth: AuthService,
    readonly dashboard: DashboardService,
    readonly theme: ThemeService,
    private readonly router: Router,
  ) {}
  ngOnInit() {
    void this.dashboard.load();
  }
  can(permission: string) {
    return this.auth.can(permission);
  }
  groupNames() {
    return (
      this.auth
        .user()
        ?.access_groups.map((group) => group.name)
        .join(', ') ?? ''
    );
  }
  title() {
    return (
      (
        {
          '/': 'Início',
          '/patients': 'Pacientes',
          '/records': 'Avaliações e evoluções',
          '/new-record': 'Novo registro',
          '/user': 'Usuários',
          '/groups': 'Grupos e permissões',
          '/audit': 'Auditoria',
        } as Record<string, string>
      )[this.router.url.split('?')[0]] ?? 'Fisio1'
    );
  }
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
