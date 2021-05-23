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

    add(value: number): void {
        this.setState(state => [...state, value]);
    }

    del(value: number): void {
        this.setState(state => state.filter(item => item !== value));
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

    it('add -> setState -> selectState', (done) => {
        service.add(2);
        service.selectState().subscribe(value => {
            expect(value).toEqual([1, 2]);
            expect(service.getCurrentState()).toEqual([1, 2]);
            done();
        });
    });

    it('del -> setState -> selectState', (done) => {
        service.del(1);
        service.selectState().subscribe(value => {
            expect(value).toEqual([]);
            expect(service.getCurrentState()).toEqual([]);
            done();
        });
    });

    it('resetState', () => {
        service.add(2);
        service.resetState();
        expect(service.getCurrentState()).toEqual([1]);
    });

    it('restartState', () => {
        service.add(2);
        service.restartState();
        expect(service.getCurrentState()).toEqual([1]);
    });
});
