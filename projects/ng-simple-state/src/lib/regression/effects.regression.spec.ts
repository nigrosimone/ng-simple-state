import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';

interface CounterState {
  count: number;
}

@Injectable()
class EffectStore extends NgSimpleStateBaseSignalStore<CounterState> {
  protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return { storeName: 'EffectCleanupStore' };
  }
  initialState(): CounterState {
    return { count: 0 };
  }
}

describe('Regression: effect cleanup on teardown', () => {
  let store: EffectStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EffectStore] });
    store = TestBed.inject(EffectStore);
  });

  it('should run the last cleanup when the effect is destroyed by name', async () => {
    const cleanup = vi.fn();
    TestBed.runInInjectionContext(() => store.createEffect('withCleanup', () => cleanup));
    await new Promise((resolve) => setTimeout(resolve));

    store.destroyEffect('withCleanup');

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should run the last cleanup when all effects are destroyed', async () => {
    const cleanup = vi.fn();
    TestBed.runInInjectionContext(() => store.createEffect('withCleanup', () => cleanup));
    await new Promise((resolve) => setTimeout(resolve));

    store.destroyAllEffects();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should run the last cleanup when an effect is replaced by the same name', async () => {
    const cleanup = vi.fn();
    TestBed.runInInjectionContext(() => store.createEffect('replaced', () => cleanup));
    await new Promise((resolve) => setTimeout(resolve));

    TestBed.runInInjectionContext(() => store.createEffect('replaced', () => undefined));
    await new Promise((resolve) => setTimeout(resolve));

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should not run a cleanup twice', async () => {
    const cleanup = vi.fn();
    TestBed.runInInjectionContext(() => store.createEffect('once', () => cleanup));
    await new Promise((resolve) => setTimeout(resolve));

    store.destroyEffect('once');
    store.destroyAllEffects();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should run the cleanup of a selector effect', async () => {
    const cleanup = vi.fn();
    TestBed.runInInjectionContext(() =>
      store.createSelectorEffect(
        'selector',
        (state) => state.count,
        () => cleanup,
      ),
    );
    await new Promise((resolve) => setTimeout(resolve));

    store.destroyEffect('selector');

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
