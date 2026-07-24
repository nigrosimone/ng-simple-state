import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { AppComponent } from './app/app.component';
import {
  provideNgSimpleState,
  undoRedoPlugin,
  NgSimpleStatePlugin,
  NgSimpleStatePluginContext,
} from 'ng-simple-state';

const myCustomPlugin: NgSimpleStatePlugin = {
  name: 'myPlugin',

  onBeforeStateChange(context: NgSimpleStatePluginContext): boolean | void {
    // Return false to prevent state change
    console.log(`Before: ${context.actionName}`, context.prevState);
  },

  onAfterStateChange(context: NgSimpleStatePluginContext): void {
    console.log(`After: ${context.actionName}`, context.nextState);
  },

  onStoreInit(storeName: string, initialState: unknown): void {
    console.log(`Store ${storeName} initialized`);
  },

  onStoreDestroy(storeName: string): void {
    console.log(`Store ${storeName} destroyed`);
  },
};

bootstrapApplication(AppComponent, {
  providers: [
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      persistentStorage: 'local',
      plugins: [undoRedoPlugin({ maxHistory: 50 }), myCustomPlugin],
      webMcp: true,
    }),
    provideZonelessChangeDetection(),
  ],
});
