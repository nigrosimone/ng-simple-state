import { enableProdMode, isDevMode, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideNgSimpleState } from 'projects/ng-simple-state/src/public-api';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';

if (!isDevMode()) {
  enableProdMode();
}

const routes: Routes = [
  { path: 'todo', loadChildren: () => import('./app/todo/todo-routing').then(m => m.routes) },
  { path: 'counter', loadChildren: () => import('./app/counter/counter-routing').then(m => m.routes) },
  { path: 'tour', loadChildren: () => import('./app/tour-of-heroes/tour-routing').then(m => m.routes) },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      enableLocalStorage: true,
      persistentStorage: 'local'
    })
  ]
});
