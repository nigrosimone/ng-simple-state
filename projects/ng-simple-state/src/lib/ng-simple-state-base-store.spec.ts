import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
export interface CounterState {
    count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

    initialState(): CounterState {
        return {
            count: 1
        };
    }

    selectCount(): Observable<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): void {
        this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): void {
        this.setState(state => ({ count: state.count - decrement }));
    }
}


describe('NgSimpleStateBaseStore', () => {

    let service: CounterStore;

    beforeEach(() => {
        service = new CounterStore(new NgSimpleStateDevTool());
    });


    it('initialState -> selectState', (done) => {
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(1);
            expect(service.getCurrentState()).toEqual({count: 1});
            done();
        });
    });

    it('increment -> setState -> selectState', (done) => {
        service.increment();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(2);
            expect(service.getCurrentState()).toEqual({count: 2});
            done();
        });
    });

    it('decrement -> setState -> selectState', (done) => {
        service.decrement();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(0);
            expect(service.getCurrentState()).toEqual({count: 0});
            done();
        });
    });

    it('get state', (done) => {
        service.state.subscribe(state => {
            expect(state.count).toBe(1);
            expect(service.getCurrentState()).toEqual({count: 1});
            done();
        });
    });

    it('decrement -> setState', (done) => {
        service.setState(() => ({ count: 5 }));
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(service.getCurrentState()).toEqual({count: 5});
            done();
        });
    });

    it('completeState', () => {
        service.completeState();
        expect(service.getCurrentState()).toEqual({count: 1});
    });

});