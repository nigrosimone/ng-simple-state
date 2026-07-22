import {
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { AppComponent } from './app/app.component';
import { NgSimpleStateLocalStorage, provideNgSimpleState, undoRedoPlugin } from 'ng-simple-state';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withExperimentalAutoCleanupInjectors } from '@angular/router';
import isEqual from 'lodash.isequal';
import { FeaturesComponent } from './app/features/features.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'features',
    pathMatch: 'full',
  },
  {
    path: 'features',
    component: FeaturesComponent,
    loadChildren: () => import('./app/features/features.routes').then((m) => m.featuresRoutes),
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
      webMcp: true,
    }),
  ],
});
