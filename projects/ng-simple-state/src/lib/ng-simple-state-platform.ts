import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * Return true when a DOM is reachable.
 * Server side rendering has neither `window` nor `document`, and the browser
 * only APIs the library touches (storage, Redux DevTools, WebMCP) are read
 * from them: they must be skipped when they are absent.
 * @returns True when running in a browser like environment
 */
export function hasDom(): boolean {
  return typeof globalThis.window !== 'undefined' && typeof globalThis.document !== 'undefined';
}

/**
 * Return true when the store is not running in a browser.
 *
 * `PLATFORM_ID` is the answer Angular gives, `hasDom()` covers the environments
 * that report themselves as a browser while missing the DOM (a Node worker
 * bootstrapping the app, a test harness): both must be false to touch a
 * browser API.
 *
 * Must be called from an injection context.
 * @returns True when running server side
 */
export function isServerPlatform(): boolean {
  return isPlatformServer(inject(PLATFORM_ID)) || !hasDom();
}
