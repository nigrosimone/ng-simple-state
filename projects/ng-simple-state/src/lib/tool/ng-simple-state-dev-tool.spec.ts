/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
import { provideNgSimpleState } from '../ng-simple-state-provider';
import { NgZone } from '@angular/core';

export class DevToolsExtension {
    name: string | null = null;
    state: string | null = null;

    connect(): any {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            send: (name: string, state: any) => {
                self.name = name;
                self.state = state;
            },
            init: () => {
                // ...
            },
            subscribe: () => {
                return () => {};
            }
        };
    }
}

describe('NgSimpleStateDevTool', () => {

    it('enableDevTool active', () => {
        (window as any)['devToolsExtension'] = new DevToolsExtension();

        TestBed.configureTestingModule({
            providers: [provideNgSimpleState({ enableDevTool: true })]
        });
        const ngZone = TestBed.inject(NgZone);
        spyOn(ngZone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
        const service = TestBed.inject(NgSimpleStateDevTool);

        expect(service.isActive()).toBe(true);
        expect(service.send('test', 'test1', 'test2')).toBe(true);
        expect((window as any)['devToolsExtension'].name).toBe('test.test1');
        expect((window as any)['devToolsExtension'].state).toEqual({ test: 'test2' });
    });

    it('no devToolsExtension', () => {
        (window as any)['devToolsExtension'] = null;

        TestBed.configureTestingModule({
            providers: [provideNgSimpleState({ enableDevTool: true })]
        });
        const ngZone = TestBed.inject(NgZone);
        spyOn(ngZone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
        const service = TestBed.inject(NgSimpleStateDevTool);

        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect((window as any)['devToolsExtension']).toBe(null);
    });

    it('no localDevTool', () => {
        (window as any)['devToolsExtension'] = {
            name: null,
            state: null,
            connect(): any {
                return null;
            }
        };

        TestBed.configureTestingModule({
            providers: [provideNgSimpleState({ enableDevTool: true })]
        });
        const ngZone = TestBed.inject(NgZone);
        spyOn(ngZone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect((window as any)['devToolsExtension'].name).toBe(null);
        expect((window as any)['devToolsExtension'].state).toBe(null);
    });
});

describe('NgSimpleStateDevTool History', () => {

    beforeEach(() => {
        (window as any)['devToolsExtension'] = new DevToolsExtension();
        TestBed.configureTestingModule({
            providers: [provideNgSimpleState({ enableDevTool: true })]
        });
        const ngZone = TestBed.inject(NgZone);
        spyOn(ngZone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
    });

    afterEach(() => {
        (window as any)['devToolsExtension'] = null;
    });

    it('should track state history', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 1 }, { count: 0 });
        service.send('testStore', 'action2', { count: 2 }, { count: 1 });
        
        const history = service.getHistory();
        expect(history.length).toBe(2);
        expect(history[0].actionName).toBe('action1');
        expect(history[1].actionName).toBe('action2');
    });

    it('should get store-specific history', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('store1', 'action1', { count: 1 });
        service.send('store2', 'action2', { count: 2 });
        service.send('store1', 'action3', { count: 3 });
        
        const store1History = service.getStoreHistory('store1');
        expect(store1History.length).toBe(2);
        expect(store1History[0].actionName).toBe('action1');
        expect(store1History[1].actionName).toBe('action3');
    });

    it('should clear history', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 1 });
        service.send('testStore', 'action2', { count: 2 });
        
        service.clearHistory();
        
        expect(service.getHistory().length).toBe(0);
    });

    it('should export state as JSON', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'init', { count: 1 });
        
        const exported = service.exportState();
        const parsed = JSON.parse(exported);
        
        expect(parsed.stores).toBeDefined();
        expect(parsed.history).toBeDefined();
        expect(parsed.exportedAt).toBeDefined();
    });

    it('should compute diff for primitive changes', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { count: 1, name: 'test' },
            { count: 2, name: 'test' }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('count');
        expect(diffs[0].type).toBe('changed');
        expect(diffs[0].oldValue).toBe(1);
        expect(diffs[0].newValue).toBe(2);
    });

    it('should compute diff for added properties', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { count: 1 },
            { count: 1, name: 'test' }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('name');
        expect(diffs[0].type).toBe('added');
        expect(diffs[0].newValue).toBe('test');
    });

    it('should compute diff for removed properties', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { count: 1, name: 'test' },
            { count: 1 }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('name');
        expect(diffs[0].type).toBe('removed');
        expect(diffs[0].oldValue).toBe('test');
    });

    it('should return empty diff for identical objects', () => {
        const obj = { count: 1, name: 'test' };
        const diffs = (NgSimpleStateDevTool as any).computeDiff(obj, obj);
        expect(diffs.length).toBe(0);
    });

    it('should handle null values in diff', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(null, { count: 1 });
        expect(diffs.length).toBe(1);
        expect(diffs[0].type).toBe('changed');
    });

    it('should handle type changes in diff', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff('string', { count: 1 });
        expect(diffs.length).toBe(1);
        expect(diffs[0].type).toBe('changed');
    });

    it('should get last diff for a store', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 2 }, { count: 1 });
        
        const diffs = service.getLastDiff('testStore');
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('count');
    });

    it('should return empty diff when no history', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        const diffs = service.getLastDiff('nonexistentStore');
        expect(diffs.length).toBe(0);
    });

    it('should return empty diff when no prevState', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 1 });
        
        const diffs = service.getLastDiff('testStore');
        expect(diffs.length).toBe(0);
    });

    it('should provide currentPosition signal', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        expect(service.currentPosition()).toBe(-1);
        
        service.send('testStore', 'action1', { count: 1 });
        
        expect(service.currentPosition()).toBeGreaterThan(-1);
    });

    it('should provide isPaused signal', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        expect(service.isPaused()).toBe(false);
    });
});


describe('NgSimpleStateDevTool Time-travel', () => {

    beforeEach(() => {
        (window as any)['devToolsExtension'] = new DevToolsExtension();
        TestBed.configureTestingModule({
            providers: [provideNgSimpleState({ enableDevTool: true })]
        });
        const ngZone = TestBed.inject(NgZone);
        spyOn(ngZone, 'runOutsideAngular').and.callFake((fn: Function) => fn());
    });

    afterEach(() => {
        (window as any)['devToolsExtension'] = null;
    });

    it('should set jump callback', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        let jumpedStore = '';
        let jumpedState: any = null;
        
        service.setJumpCallback((storeName, state) => {
            jumpedStore = storeName;
            jumpedState = state;
        });
        
        service.send('testStore', 'action1', { count: 1 });
        const history = service.getHistory();
        
        service.jumpToAction(history[0].id);
        
        expect(jumpedStore).toBe('testStore');
        expect(jumpedState).toEqual({ count: 1 });
    });

    it('should not jump without callback', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 1 });
        const history = service.getHistory();
        
        // Should not throw when no callback set
        expect(() => service.jumpToAction(history[0].id)).not.toThrow();
    });

    it('should not jump to non-existent action', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        let jumpCalled = false;
        service.setJumpCallback(() => { jumpCalled = true; });
        
        service.jumpToAction(999);
        
        expect(jumpCalled).toBe(false);
    });

    it('should not send when paused', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        // Access internal isPausedSig to set it true
        (service as any).isPausedSig.set(true);
        
        const result = service.send('testStore', 'action1', { count: 1 });
        
        expect(result).toBe(false);
        
        // Reset
        (service as any).isPausedSig.set(false);
    });

    it('should trim history when exceeding max size', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        // Send more entries than maxHistorySize (default 100)
        for (let i = 0; i < 105; i++) {
            service.send('testStore', `action${i}`, { count: i });
        }
        
        const history = service.getHistory();
        expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should update currentPosition on send', () => {
        const service = TestBed.inject(NgSimpleStateDevTool);
        
        service.send('testStore', 'action1', { count: 1 });
        const pos1 = service.currentPosition();
        
        service.send('testStore', 'action2', { count: 2 });
        const pos2 = service.currentPosition();
        
        expect(pos2).toBeGreaterThan(pos1);
    });
});


describe('NgSimpleStateDevTool computeDiff edge cases', () => {

    it('should handle undefined values', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(undefined, { count: 1 });
        expect(diffs.length).toBe(1);
        expect(diffs[0].type).toBe('added');
    });

    it('should handle nested objects', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { user: { name: 'old', age: 25 } },
            { user: { name: 'new', age: 25 } }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('user.name');
    });

    it('should handle array changes', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { items: [1, 2, 3] },
            { items: [1, 2, 4] }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('items.2');
    });

    it('should handle both undefined', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(undefined, undefined);
        expect(diffs.length).toBe(0);
    });

    it('should handle empty objects', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff({}, {});
        expect(diffs.length).toBe(0);
    });

    it('should detect type changes', () => {
        const diffs = (NgSimpleStateDevTool as any).computeDiff(
            { value: 'string' },
            { value: 123 }
        );
        
        expect(diffs.length).toBe(1);
        expect(diffs[0].type).toBe('changed');
    });
});
