import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem('fisio1-token');
  return next(
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request,
  );
};
