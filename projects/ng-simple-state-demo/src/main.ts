import { isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { NgSimpleStateLocalStorage, provideNgSimpleState, undoRedoPlugin } from 'ng-simple-state';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withExperimentalAutoCleanupInjectors } from '@angular/router';
import isEqual from 'lodash.isequal';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'features',
    pathMatch: 'full'
  },
  {
    path: 'features',
    loadComponent: () => import('./app/features/features.component').then(m => m.FeaturesComponent),
    loadChildren: () => import('./app/features/features.routes').then(m => m.featuresRoutes)
  },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withExperimentalAutoCleanupInjectors()),
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      persistentStorage: new NgSimpleStateLocalStorage(),
      comparator: isEqual,
      plugins: [undoRedoPlugin({ maxHistory: 50 })],
      webMcp: true
    })
  ]
});
