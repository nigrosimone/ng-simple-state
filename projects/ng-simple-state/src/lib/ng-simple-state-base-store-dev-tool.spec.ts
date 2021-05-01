import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';
import { DevToolsExtension } from './ng-simple-state-dev-tool.spec';

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
        window["devToolsExtension"] = new DevToolsExtension();
        service = new CounterStore(new NgSimpleStateDevTool({enableDevTool: true}));
    });

    it('dev tool', (done) => {
        expect(window["devToolsExtension"].name).toBe('CounterStore.initialState');
        expect(window["devToolsExtension"].state).toEqual({ count: 1 });

        service.increment();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(2);
            expect(window["devToolsExtension"].name).toBe('CounterStore.increment');
            expect(window["devToolsExtension"].state).toEqual({ count: 2 });
            done();
        });
    });

    it('dev tool action name', (done) => {
        expect(window["devToolsExtension"].name).toBe('CounterStore.initialState');
        expect(window["devToolsExtension"].state).toEqual({ count: 1 });

        service.setState(() => ({ count: 5 }), 'test');
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(window["devToolsExtension"].name).toBe('test');
            expect(window["devToolsExtension"].state).toEqual({ count: 5 });
            done();
        });
    });

});