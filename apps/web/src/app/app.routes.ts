import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'analyses/:id',
    loadComponent: () =>
      import('./pages/analysis-detail/analysis-detail.component').then(
        (m) => m.AnalysisDetailComponent
      ),
  },
  { path: '**', redirectTo: '' },
];