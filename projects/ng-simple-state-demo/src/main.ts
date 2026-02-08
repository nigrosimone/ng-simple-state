import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { NgSimpleStateLocalStorage, provideNgSimpleState, undoRedoPlugin } from 'projects/ng-simple-state/src/public-api';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import isEqual from 'lodash.isequal';

const routes: Routes = [
  { path: 'todo', loadComponent: () => import('./app/todo/todo.component').then(m => m.TodoComponent) },
  { path: 'counter', loadComponent: () => import('./app/counter/counter.component').then(m => m.CounterComponent) },
  { path: 'tour', loadChildren: () => import('./app/tour-of-heroes/tour-routing').then(m => m.routes) },
  {
    path: 'features',
    loadComponent: () => import('./app/features/features.component').then(m => m.FeaturesComponent),
    loadChildren: () => import('./app/features/features.routes').then(m => m.featuresRoutes)
  },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      persistentStorage: new NgSimpleStateLocalStorage(),
      comparator: isEqual,
      plugins: [undoRedoPlugin({ maxHistory: 50 })]
    })
  ]
});
