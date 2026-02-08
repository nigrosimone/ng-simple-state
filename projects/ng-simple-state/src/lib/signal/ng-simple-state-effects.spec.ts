/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Injector, Signal, runInInjectionContext } from '@angular/core';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';

export interface EffectsTestState {
    count: number;
    name: string;
}

@Injectable()
export class EffectsTestStore extends NgSimpleStateBaseSignalStore<EffectsTestState> {

    public effectCallCount = 0;
    public lastEffectState: EffectsTestState | null = null;
    public selectorEffectCallCount = 0;
    public lastSelectorValue: number | null = null;

    protected storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'EffectsTestStore'
        };
    }

    initialState(): EffectsTestState {
        return {
            count: 0,
            name: 'test'
        };
    }

    selectCount(): Signal<number> {
        return this.selectState(state => state.count);
    }

    increment(): void {
        this.setState(state => ({ count: state.count + 1 }));
    }

    setName(name: string): void {
        this.setState({ name });
    }

    registerTestEffect(): void {
        this.createEffect('testEffect', (state) => {
            this.effectCallCount++;
            this.lastEffectState = state;
        });
    }

    registerSelectorTestEffect(): void {
        this.createSelectorEffect(
            'selectorEffect',
            state => state.count,
            (count) => {
                this.selectorEffectCallCount++;
                this.lastSelectorValue = count;
            }
        );
    }

    destroyTestEffect(): void {
        this.destroyEffect('testEffect');
    }

    destroySelectorTestEffect(): void {
        this.destroyEffect('selectorEffect');
    }
}


describe('NgSimpleStateBaseSignalStore: Effects', () => {

    let store: EffectsTestStore;
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [EffectsTestStore] });
        store = TestBed.inject(EffectsTestStore);
        injector = TestBed.inject(Injector);
    });

    afterEach(() => {
        store.ngOnDestroy();
    });

    it('should have destroyEffect method', () => {
        expect(typeof store.destroyEffect).toBe('function');
    });

    it('should have createEffect method', () => {
        expect(typeof store.createEffect).toBe('function');
    });

    it('should have createSelectorEffect method', () => {
        expect(typeof store.createSelectorEffect).toBe('function');
    });

    it('should register and destroy effects without error', () => {
        runInInjectionContext(injector, () => {
            expect(() => store.registerTestEffect()).not.toThrow();
            expect(() => store.destroyTestEffect()).not.toThrow();
        });
    });

    it('should register and destroy selector effects without error', () => {
        runInInjectionContext(injector, () => {
            expect(() => store.registerSelectorTestEffect()).not.toThrow();
            expect(() => store.destroySelectorTestEffect()).not.toThrow();
        });
    });

    it('should handle destroying non-existent effect', () => {
        expect(() => store.destroyEffect('nonExistent')).not.toThrow();
    });

    it('should replace effect with same name without error', () => {
        runInInjectionContext(injector, () => {
            store.createEffect('sameNameEffect', () => { });
            expect(() => store.createEffect('sameNameEffect', () => { })).not.toThrow();
            store.destroyEffect('sameNameEffect');
        });
    });

    it('should call previous cleanup before running effect again', fakeAsync(() => {
        const cleanup1 = jasmine.createSpy('cleanup1');
        const cleanup2 = jasmine.createSpy('cleanup2');

        const effectFn = jasmine
            .createSpy('effectFn')
            .and.returnValues(cleanup1, cleanup2);

        TestBed.runInInjectionContext(() => {
            store.createEffect('test', effectFn);
        });

        flush();

        expect(effectFn).toHaveBeenCalledTimes(1);
        expect(cleanup1).not.toHaveBeenCalled();

        store.setState({ count: 1 });

        flush();

        expect(effectFn).toHaveBeenCalledTimes(2);
        expect(cleanup1).toHaveBeenCalledTimes(1);
        expect(cleanup2).not.toHaveBeenCalled();
    }));
});
