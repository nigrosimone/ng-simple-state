import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateBaseRxjsStore } from '../rxjs/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState, provideNgSimpleStatePlugins } from '../ng-simple-state-provider';
import {
    NgSimpleStatePlugin,
    NgSimpleStateStoreRef,
    NG_SIMPLE_STATE_UNDO_REDO,
    persistPlugin,
    undoRedoPlugin
} from '../plugin/ng-simple-state-plugin';

interface CounterState { count: number; name: string }

describe('Regression: plugin hook ordering', () => {

    it('should expose the committed state to onAfterStateChange', () => {
        let seenByPlugin: CounterState | undefined;
        // the plugin has to reach the store that is created after it
        const ref: { store?: OrderingStore } = {};

        const observer: NgSimpleStatePlugin<CounterState> = {
            name: 'observer',
            onAfterStateChange: () => { seenByPlugin = ref.store?.getCurrentState(); }
        };

        @Injectable()
        class OrderingStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'HookOrderingStore', plugins: [observer as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
            increment(): boolean { return this.setState(state => ({ count: state.count + 1 })); }
        }

        TestBed.configureTestingModule({ providers: [OrderingStore] });
        ref.store = TestBed.inject(OrderingStore);
        ref.store.increment();

        expect(seenByPlugin).toEqual({ count: 1, name: 'a' });
    });

    it('should keep a state change performed from within onAfterStateChange', () => {
        // the plugin has to reach the store that is created after it
        const ref: { store?: ReentrantStore } = {};
        let alreadyRan = false;

        const reentrant: NgSimpleStatePlugin<CounterState> = {
            name: 'reentrant',
            onAfterStateChange: () => {
                if (alreadyRan) {
                    return;
                }
                alreadyRan = true;
                ref.store?.setState({ name: 'set-by-plugin' }, 'pluginAction');
            }
        };

        @Injectable()
        class ReentrantStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'ReentrantStore', plugins: [reentrant as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
            increment(): boolean { return this.setState(state => ({ count: state.count + 1 })); }
        }

        TestBed.configureTestingModule({ providers: [ReentrantStore] });
        ref.store = TestBed.inject(ReentrantStore);
        ref.store.increment();

        expect(ref.store.getCurrentState()).toEqual({ count: 1, name: 'set-by-plugin' });
    });

    it('rxjs store: should notify every change when a synchronous subscriber nests one', () => {
        const notified: string[] = [];
        const recorder: NgSimpleStatePlugin<CounterState> = {
            name: 'recorder',
            onAfterStateChange: context => {
                notified.push(`${context.actionName}:${(context.nextState as CounterState).count}`);
            }
        };

        @Injectable()
        class NestedStore extends NgSimpleStateBaseRxjsStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'NestedRxjsStore', plugins: [recorder as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
        }

        TestBed.configureTestingModule({ providers: [NestedStore] });
        const store = TestBed.inject(NestedStore);

        // subscribers of a BehaviorSubject run synchronously, so this nests a
        // second change right in the middle of the first one
        let nested = false;
        store.state.subscribe(state => {
            if (state.count === 1 && !nested) {
                nested = true;
                store.setState({ count: 2 }, 'nested');
            }
        });

        store.setState({ count: 1 }, 'outer');

        expect(store.getCurrentState().count).toBe(2);
        expect(notified).toEqual(['outer:1', 'nested:2']);
    });
});

describe('Regression: persistPlugin', () => {

    it('should hydrate the store through the load() callback', () => {
        const saved: Record<string, unknown> = { HydratedStore: { count: 42, name: 'restored' } };
        const plugin = persistPlugin<CounterState>({
            save: (storeName, state) => { saved[storeName] = state; },
            load: storeName => (saved[storeName] as CounterState) ?? null
        });

        @Injectable()
        class HydratedStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'HydratedStore', plugins: [plugin as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
        }

        TestBed.configureTestingModule({ providers: [HydratedStore] });

        expect(TestBed.inject(HydratedStore).getCurrentState()).toEqual({ count: 42, name: 'restored' });
    });

    it('should keep initialState() when load() returns null', () => {
        const plugin = persistPlugin<CounterState>({
            save: () => undefined,
            load: () => null
        });

        @Injectable()
        class EmptyStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'EmptyLoadStore', plugins: [plugin as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
        }

        TestBed.configureTestingModule({ providers: [EmptyStore] });

        expect(TestBed.inject(EmptyStore).getCurrentState()).toEqual({ count: 0, name: 'a' });
    });

    it('should not load a store excluded by filter()', () => {
        const plugin = persistPlugin<CounterState>({
            save: () => undefined,
            load: () => ({ count: 99, name: 'nope' }),
            filter: storeName => storeName === 'SomeOtherStore'
        });

        @Injectable()
        class FilteredStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'FilteredLoadStore', plugins: [plugin as NgSimpleStatePlugin] };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
        }

        TestBed.configureTestingModule({ providers: [FilteredStore] });

        expect(TestBed.inject(FilteredStore).getCurrentState()).toEqual({ count: 0, name: 'a' });
    });
});

describe('Regression: plugin providers', () => {

    it('should register NG_SIMPLE_STATE_UNDO_REDO from provideNgSimpleStatePlugins()', () => {
        const plugin = undoRedoPlugin();
        TestBed.configureTestingModule({ providers: [provideNgSimpleStatePlugins([plugin])] });

        expect(TestBed.inject(NG_SIMPLE_STATE_UNDO_REDO, null)).toBe(plugin);
    });

    it('should keep both plugin sets when the two providers are combined', () => {
        const undoRedo = undoRedoPlugin<CounterState>();
        const logger: NgSimpleStatePlugin = { name: 'logger', onAfterStateChange: () => undefined };

        @Injectable()
        class CombinedStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return { storeName: 'CombinedProvidersStore' };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
            increment(): boolean { return this.setState(state => ({ count: state.count + 1 })); }
        }

        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ plugins: [undoRedo as NgSimpleStatePlugin] }),
                provideNgSimpleStatePlugins([logger]),
                CombinedStore
            ]
        });
        TestBed.inject(CombinedStore).increment();

        expect(undoRedo.canUndo('CombinedProvidersStore')).toBeTrue();
    });
});

describe('Regression: undoRedoPlugin atomicity', () => {

    /** Builds a store whose state changes can be vetoed on demand. */
    function setup(storeName: string) {
        const undoRedo = undoRedoPlugin<CounterState>();
        const veto = { enabled: false };
        const lock: NgSimpleStatePlugin<CounterState> = {
            name: 'lock',
            onBeforeStateChange: () => veto.enabled ? false : undefined
        };

        @Injectable()
        class VetoStore extends NgSimpleStateBaseSignalStore<CounterState> {
            protected storeConfig(): NgSimpleStateStoreConfig<CounterState> {
                return {
                    storeName,
                    plugins: [undoRedo as NgSimpleStatePlugin, lock as NgSimpleStatePlugin]
                };
            }
            initialState(): CounterState { return { count: 0, name: 'a' }; }
            setCount(count: number): boolean { return this.setState({ count }); }
        }

        TestBed.configureTestingModule({ providers: [VetoStore] });
        const store = TestBed.inject(VetoStore);
        const history = undoRedo.forStore(store as unknown as NgSimpleStateStoreRef<CounterState>);
        return { store, history, undoRedo, veto };
    }

    it('should report false and leave the history untouched when undo is rejected', () => {
        const { store, history, veto } = setup('VetoUndoStore');
        store.setCount(1);
        store.setCount(2);

        veto.enabled = true;
        expect(history.undo()).toBeFalse();
        veto.enabled = false;

        expect(store.getCurrentState().count).toBe(2);
        expect(history.canUndo()).toBeTrue();
        expect(history.canRedo()).toBeFalse();
    });

    it('should not misroute the next action after a rejected undo', () => {
        const { store, history, veto } = setup('VetoNextActionStore');
        store.setCount(1);
        store.setCount(2);

        veto.enabled = true;
        history.undo();
        veto.enabled = false;

        store.setCount(99);

        expect(history.canUndo()).toBeTrue();
        expect(history.canRedo()).toBeFalse();
        expect(history.undo()).toBeTrue();
        expect(store.getCurrentState().count).toBe(2);
    });

    it('should keep the reactive flags in sync when the raw undo() API is used', () => {
        const { store, undoRedo } = setup('RawApiSyncStore');
        store.setCount(1);
        expect(undoRedo.selectCanUndo('RawApiSyncStore')()).toBeTrue();

        // the raw API pops the history and hands the state back to the caller,
        // who may never apply it — the reactive flags must not lag behind
        undoRedo.undo('RawApiSyncStore');

        expect(undoRedo.selectCanUndo('RawApiSyncStore')()).toBe(undoRedo.canUndo('RawApiSyncStore'));
        expect(undoRedo.selectCanRedo('RawApiSyncStore')()).toBe(undoRedo.canRedo('RawApiSyncStore'));
    });

    it('should keep canUndo() and selectCanUndo() in sync', () => {
        const { store, history } = setup('SignalSyncStore');
        store.setCount(1);

        expect(history.selectCanUndo()()).toBe(history.canUndo());

        history.undo();
        expect(history.selectCanUndo()()).toBe(history.canUndo());
        expect(history.selectCanRedo()()).toBe(history.canRedo());
    });

    it('should keep the plain and reactive flags in sync through a full undo/redo cycle', () => {
        const { store, history } = setup('FullCycleStore');
        store.setCount(1);
        store.setCount(2);

        history.undo();
        expect(store.getCurrentState().count).toBe(1);
        expect(history.selectCanRedo()()).toBeTrue();
        expect(history.selectCanRedo()()).toBe(history.canRedo());

        history.redo();
        expect(store.getCurrentState().count).toBe(2);
        expect(history.selectCanRedo()()).toBeFalse();
        expect(history.selectCanUndo()()).toBe(history.canUndo());
    });
});
