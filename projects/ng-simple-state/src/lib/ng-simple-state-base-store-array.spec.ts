import { Injectable, Injector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';


export type NumbersState = number[];

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<NumbersState> {

    initialState(): NumbersState {
        return [1];
    }

    selectAll(): Observable<number[]> {
        return this.selectState(state => [...state]);
    }

    add(value: number): boolean {
        return this.setState(state => [...state, value]);
    }

    del(value: number): boolean {
        return this.setState(state => state.filter(item => item !== value));
    }
}


describe('NgSimpleStateBaseStoreArray', () => {

    let service: CounterStore;

    beforeEach(inject([Injector], (injector: Injector) => {
        service = new CounterStore(injector);
    }));


    it('initialState -> selectState', (done) => {
        service.selectState().subscribe(value => {
            expect(value).toEqual([1]);
            expect(service.getCurrentState()).toEqual([1]);
            done();
        });
    });

    it('no changes', () => {
        expect(service.setState((state) => state as any)).toBeFalse();
    });

    it('add -> setState -> selectState', (done) => {
        expect(service.add(2)).toBeTrue();
        service.selectState().subscribe(value => {
            expect(value).toEqual([1, 2]);
            expect(service.getCurrentState()).toEqual([1, 2]);
            done();
        });
    });

    it('del -> setState -> selectState', (done) => {
        expect(service.del(1)).toBeTrue();
        service.selectState().subscribe(value => {
            expect(value).toEqual([]);
            expect(service.getCurrentState()).toEqual([]);
            done();
        });
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
