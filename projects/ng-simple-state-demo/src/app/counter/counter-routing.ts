import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () =>  import('./counter.component').then(m => m.CounterComponent) },
];

