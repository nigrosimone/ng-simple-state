import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateBaseRxjsStore } from '../rxjs/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { NgSimpleStatePlugin } from '../plugin/ng-simple-state-plugin';

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
