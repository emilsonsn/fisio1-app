import { Routes } from '@angular/router';
import { administrationGuard, auditGuard, authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login-page.component').then((module) => module.LoginPageComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then((module) => module.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (module) => module.DashboardPageComponent,
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patients-page.component').then(
            (module) => module.PatientsPageComponent,
          ),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./features/clinical-records/clinical-records-page.component').then(
            (module) => module.ClinicalRecordsPageComponent,
          ),
      },
      {
        path: 'new-record',
        loadComponent: () =>
          import('./features/clinical-records/clinical-record-form-page.component').then(
            (module) => module.ClinicalRecordFormPageComponent,
          ),
      },
      {
        path: 'user',
        canActivate: [administrationGuard],
        loadComponent: () =>
          import('./features/users/users-page.component').then(
            (module) => module.UsersPageComponent,
          ),
      },
      {
        path: 'groups',
        canActivate: [administrationGuard],
        loadComponent: () =>
          import('./features/access-groups/access-groups-page.component').then(
            (module) => module.AccessGroupsPageComponent,
          ),
      },
      {
        path: 'audit',
        canActivate: [auditGuard],
        loadComponent: () =>
          import('./features/audit-logs/audit-logs-page.component').then(
            (module) => module.AuditLogsPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
