/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from './ng-simple-state-models';
import { provideNgSimpleState } from './ng-simple-state-provider';

export interface CounterState {
    count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

    protected storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'CounterStore'
        };
    }

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Signal<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.setState(state => ({ count: state.count - decrement }));
    }
}


describe('NgSimpleStateBaseSignalStore: Service', () => {

    let service: CounterStore;

    beforeEach(() => {
        const injector = TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({
                    enableDevTool: false,
                    comparator: (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
                }),
                CounterStore
            ]
        });
        service = injector.inject(CounterStore);
    });


    it('initialState -> selectState', () => {
        const value = service.selectState(state => state.count);
        expect(value()).toBe(1);
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('increment -> setState -> selectState', () => {
        expect(service.increment()).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(2);
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 2 });

    });

    it('decrement -> setState -> selectState', () => {
        expect(service.decrement()).toBeTrue();
        const value = service.selectState()
        expect(value()).toEqual({ count: 0 });
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 0 });
    });

    it('decrement -> setState', () => {
        expect(service.setState({ count: 9 })).toBeTrue();
        const value = service.selectState()
        expect(value()).toEqual({ count: 9 });
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 9 });
        expect(service.setState(service.getCurrentState())).toBeFalse();
        expect(service.setState({ count: 9 })).toBeFalse();
    });
});
