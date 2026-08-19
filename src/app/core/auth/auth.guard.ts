import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user() || (await auth.restore())) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user() || (await auth.restore())) return router.createUrlTree(['/']);
  return true;
};

export const administrationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.can('users.manage') ? true : router.createUrlTree(['/']);
};

export const auditGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.can('groups.manage') && auth.can('audit_logs.view')
    ? true
    : router.createUrlTree(['/']);
};
