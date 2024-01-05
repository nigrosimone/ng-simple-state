/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Injector, Signal } from '@angular/core';
import { inject } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';


export type NumbersState = number[];

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<NumbersState> {

    protected storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'CounterStore'
        };
    }

    initialState(): NumbersState {
        return [1];
    }

    selectAll(): Signal<number[]> {
        return this.selectState(state => [...state]);
    }

    add(value: number): boolean {
        return this.setState(state => [...state, value]);
    }

    del(value: number): boolean {
        return this.setState(state => state.filter(item => item !== value));
    }
}


describe('NgSimpleStateBaseSignalStoreArray', () => {

    let service: CounterStore;

    beforeEach(inject([Injector], (injector: Injector) => {
        service = new CounterStore(injector);
    }));


    it('initialState -> selectState', () => {
        const value = service.selectState()
        expect(value()).toEqual([1]);
        expect(service.getCurrentState()).toEqual([1]);
    });

    it('no changes', () => {
        expect(service.setState((state) => state as any)).toBeFalse();
    });

    it('add -> setState -> selectState', () => {
        expect(service.add(2)).toBeTrue();
        const value = service.selectState()
        expect(value()).toEqual([1, 2]);
        expect(service.getCurrentState()).toEqual([1, 2]);
    });

    it('del -> setState -> selectState', () => {
        expect(service.del(1)).toBeTrue();
        const value = service.selectState()
        expect(value()).toEqual([]);
        expect(service.getCurrentState()).toEqual([]);
    });

    it('resetState', () => {
        expect(service.add(2)).toBeTrue();
        expect(service.resetState()).toBeTrue();
        expect(service.getCurrentState()).toEqual([1]);
    });

    it('restartState', () => {
        expect(service.add(2)).toBeTrue();
        expect(service.restartState()).toBeTrue();
        expect(service.getCurrentState()).toEqual([1]);
    });
});
