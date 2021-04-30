import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';
import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';

class DevToolsExtension {
    name = null;
    state = null;
    
    connect() {
        const self = this;
        return {
            send: (name: string, state: any) => {
                self.name = name;
                self.state = state;
            }
        }
    }
};

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


describe('NgSimpleState', () => {

    let service: CounterStore;

    beforeEach(() => {
        window["devToolsExtension"] = new DevToolsExtension();
        service = new CounterStore(new NgSimpleStateDevTool({enableDevTool: true}));
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
            expect(window["devToolsExtension"].name).toBe('CounterStore.increment');
            expect(window["devToolsExtension"].state).toEqual({count: 2});
            done();
        });
    });

    it('decrement -> setState -> selectState', (done) => {
        service.decrement();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(0);
            expect(service.getCurrentState()).toEqual({count: 0});
            expect(window["devToolsExtension"].name).toBe('CounterStore.decrement');
            expect(window["devToolsExtension"].state).toEqual({count: 0});
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
        service.setState(() => ({ count: 5 }), 'test');
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(service.getCurrentState()).toEqual({count: 5});
            expect(window["devToolsExtension"].name).toBe('test');
            expect(window["devToolsExtension"].state).toEqual({count: 5});
            done();
        });
    });

    it('completeState', () => {
        service.completeState();
        expect(service.getCurrentState()).toEqual({count: 1});
    });

    it('no dev tool', (done) => {
        const _service = new CounterStore(new NgSimpleStateDevTool({enableDevTool: false}));
        _service.setState(() => ({ count: 5 }), 'test');
        _service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(_service.getCurrentState()).toEqual({count: 5});
            expect(window["devToolsExtension"].name).toEqual(null);
            expect(window["devToolsExtension"].state).toEqual(null);
            done();
        });
    });

    it('no dev tool 2', (done) => {
        const _service = new CounterStore(new NgSimpleStateDevTool());
        _service.setState(() => ({ count: 5 }), 'test');
        _service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(_service.getCurrentState()).toEqual({count: 5});
            expect(window["devToolsExtension"].name).toEqual(null);
            expect(window["devToolsExtension"].state).toEqual(null);
            done();
        });
    });

    it('no dev tool 3', (done) => {
        window["devToolsExtension"] = null;
        const _service = new CounterStore(new NgSimpleStateDevTool());
        _service.setState(() => ({ count: 5 }), 'test');
        _service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(_service.getCurrentState()).toEqual({count: 5});
            expect(window["devToolsExtension"]).toEqual(null);
            done();
        });
    });

    it('no dev tool 4', (done) => {
        window["devToolsExtension"] = { 
            name: null,
            state: null,
            connect: () => {
                return null;
            }
        };
        const _service = new CounterStore(new NgSimpleStateDevTool({enableDevTool: true}));
        _service.setState(() => ({ count: 5 }), 'test');
        _service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(_service.getCurrentState()).toEqual({count: 5});
            expect(window["devToolsExtension"].name).toEqual(null);
            expect(window["devToolsExtension"].state).toEqual(null);
            done();
        });
    });

});