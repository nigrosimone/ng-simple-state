import { Routes } from '@angular/router';

export const featuresRoutes: Routes = [
  { path: '', redirectTo: 'effects', pathMatch: 'full' },
  { path: 'effects', loadComponent: () => import('./effects/effects-demo.component').then(m => m.EffectsDemoComponent) },
  { path: 'linked-signals', loadComponent: () => import('./linked-signals/linked-signals-demo.component').then(m => m.LinkedSignalsDemoComponent) },
  { path: 'plugins', loadComponent: () => import('./plugins/plugins-demo.component').then(m => m.PluginsDemoComponent) },
  { path: 'batch', loadComponent: () => import('./batch/batch-demo.component').then(m => m.BatchDemoComponent) },
];
