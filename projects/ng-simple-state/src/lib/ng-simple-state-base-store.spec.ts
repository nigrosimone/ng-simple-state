import { Injectable, Injector } from '@angular/core';
import { inject } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';
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

    beforeEach(inject([Injector], (injector: Injector) => {
        service = new CounterStore(injector);
    }));


    it('initialState -> selectState', (done) => {
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(1);
            expect(service.getCurrentState()).toEqual({ count: 1 });
            done();
        });
    });

    it('increment -> setState -> selectState', (done) => {
        service.increment();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(2);
            expect(service.getCurrentState()).toEqual({ count: 2 });
            done();
        });
    });

    it('decrement -> setState -> selectState', (done) => {
        service.decrement();
        service.selectState().subscribe(value => {
            expect(value).toEqual({ count: 0 });
            expect(service.getCurrentState()).toEqual({ count: 0 });
            done();
        });
    });

    it('get state', (done) => {
        service.state.subscribe(state => {
            expect(state.count).toBe(1);
            expect(service.getCurrentState()).toEqual({ count: 1 });
            done();
        });
    });

    it('decrement -> setState', (done) => {
        service.setState(() => ({ count: 5 }));
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(service.getCurrentState()).toEqual({ count: 5 });
            done();
        });
    });

    it('ngOnDestroy', () => {
        service.ngOnDestroy();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('resetState', () => {
        service.setState(() => ({ count: 5 }));
        service.resetState();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('restartState', () => {
        service.setState(() => ({ count: 5 }));
        service.restartState();
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });
});
