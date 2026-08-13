import { Routes } from '@angular/router';
import { RoutePlaceholderComponent } from './route-placeholder.component';

export const routes: Routes = [
  { path: '', component: RoutePlaceholderComponent },
  { path: 'patients', component: RoutePlaceholderComponent },
  { path: 'records', component: RoutePlaceholderComponent },
  { path: 'new-record', component: RoutePlaceholderComponent },
  { path: 'user', component: RoutePlaceholderComponent },
  { path: 'groups', component: RoutePlaceholderComponent },
  { path: '**', redirectTo: '' },
];
