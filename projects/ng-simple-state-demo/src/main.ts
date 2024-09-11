import { enableProdMode, importProvidersFrom, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { NgSimpleStateModule } from 'projects/ng-simple-state/src/public-api';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';

if (environment.production) {
  enableProdMode();
}

const routes: Routes = [
  { path: 'todo', loadChildren: () => import('./app/todo/todo-routing').then(m => m.routes) },
  { path: 'counter', loadChildren: () => import('./app/counter/counter-routing').then(m => m.routes) }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    importProvidersFrom(NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production,
      enableLocalStorage: true,
      persistentStorage: 'local'
    }))
  ]
});
