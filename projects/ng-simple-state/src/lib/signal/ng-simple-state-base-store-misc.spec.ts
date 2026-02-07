/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { BASE_KEY } from '../storage/ng-simple-state-browser-storage';
import { DevToolsExtension } from '../tool/ng-simple-state-dev-tool.spec';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';

export interface CounterState {
    count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

    override storeConfig(): NgSimpleStateStoreConfig {
        return {
            enableDevTool: true,
            storeName: 'storeName'
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
        return this.setState(state => ({ count: state.count + increment }), 'increment');
    }

    decrement(decrement: number = 1): boolean {
        return this.replaceState(state => ({ count: state.count - decrement }), 'decrement');
    }
}


describe('NgSimpleStateBaseSignalStore misc 1', () => {

    let service: CounterStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({
                    enableDevTool: false,
                    persistentStorage: 'local'
                }),
                CounterStore
            ]
        });
        (window as any)['devToolsExtension'] = new DevToolsExtension();

        localStorage.setItem(BASE_KEY + 'storeName', JSON.stringify({
            count: 2
        }));

        service = TestBed.inject(CounterStore);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('dev tool', () => {
        expect((window as any)['devToolsExtension'].name).toBe('storeName.initialState');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 2 } });

        expect(service.increment()).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(3);
        expect((window as any)['devToolsExtension'].name).toBe('storeName.increment');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 3 } });
    });

    it('dev tool action name', () => {
        expect((window as any)['devToolsExtension'].name).toBe('storeName.initialState');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 2 } });

        expect(service.setState(() => ({ count: 5 }), 'test')).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(5);
        expect((window as any)['devToolsExtension'].name).toBe('storeName.test');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 5 } });
    });

});




describe('NgSimpleStateBaseSignalStore misc 2', () => {

    let service: CounterStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({
                    enableDevTool: false,
                    persistentStorage: 'session'
                }),
                CounterStore
            ]
        });
        (window as any)['devToolsExtension'] = new DevToolsExtension();

        sessionStorage.setItem(BASE_KEY + 'storeName', JSON.stringify({
            count: 2
        }));

        service = TestBed.inject(CounterStore);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('dev tool', () => {
        expect((window as any)['devToolsExtension'].name).toBe('storeName.initialState');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 2 } });

        expect(service.increment()).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(3);
        expect((window as any)['devToolsExtension'].name).toBe('storeName.increment');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 3 } });
    });

    it('dev tool action name', () => {
        expect((window as any)['devToolsExtension'].name).toBe('storeName.initialState');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 2 } });

        expect(service.setState(() => ({ count: 5 }), 'test')).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(5);
        expect((window as any)['devToolsExtension'].name).toBe('storeName.test');
        expect((window as any)['devToolsExtension'].state).toEqual({ storeName: { count: 5 } });
    });

});
