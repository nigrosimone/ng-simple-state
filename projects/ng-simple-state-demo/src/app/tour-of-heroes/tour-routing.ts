import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TourComponent } from './tour.component';

export const routes: Routes = [
  {
    path: '', component: TourComponent,
    children: [
      {
        path: '', redirectTo: 'dashboard', pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'detail/:id',
        loadComponent: () =>
          import('./hero-detail/hero-detail.component').then(
            (c) => c.HeroDetailComponent
          ),
      },
      {
        path: 'heroes',
        loadComponent: () =>
          import('./heroes/heroes.component').then((c) => c.HeroesComponent),
      },
    ]
  },
];
