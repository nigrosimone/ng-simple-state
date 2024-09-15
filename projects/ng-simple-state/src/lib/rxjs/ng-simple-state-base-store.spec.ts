/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, DebugElement, Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseRxjsStore } from './ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';

export interface CounterState {
    count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {

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

    selectCount(): Observable<number> {
        return this.selectState(state => state.count);
    }

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.setState(state => ({ count: state.count - decrement }));
    }
}


describe('NgSimpleStateBaseRxjsStore: Service', () => {

    let service: CounterStore;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [CounterStore] });
        service = TestBed.inject(CounterStore);
    });


    it('initialState -> selectState', (done) => {
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(1);
            expect(service.getFirstState()).toEqual({ count: 1 });
            expect(service.getCurrentState()).toEqual({ count: 1 });
            done();
        });
    });

    it('increment -> setState -> selectState', (done) => {
        expect(service.increment()).toBeTrue();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(2);
            expect(service.getFirstState()).toEqual({ count: 1 });
            expect(service.getCurrentState()).toEqual({ count: 2 });
            done();
        });
    });

    it('decrement -> setState -> selectState', (done) => {
        expect(service.decrement()).toBeTrue();
        service.selectState().subscribe(value => {
            expect(value).toEqual({ count: 0 });
            expect(service.getFirstState()).toEqual({ count: 1 });
            expect(service.getCurrentState()).toEqual({ count: 0 });
            done();
        });
    });

    it('no changes', () => {
        expect(service.setState(state => state)).toBeFalse();
    });

    it('get state', (done) => {
        service.state.subscribe(state => {
            expect(state.count).toBe(1);
            expect(service.getFirstState()).toEqual({ count: 1 });
            expect(service.getCurrentState()).toEqual({ count: 1 });
            done();
        });
    });

    it('decrement -> setState', (done) => {
        expect(service.setState(() => ({ count: 5 }))).toBeTrue();
        service.selectState(state => state.count).subscribe(value => {
            expect(value).toBe(5);
            expect(service.getFirstState()).toEqual({ count: 1 });
            expect(service.getCurrentState()).toEqual({ count: 5 });
            done();
        });
    });

    it('ngOnDestroy', () => {
        service.ngOnDestroy();
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('resetState', () => {
        expect(service.setState(() => ({ count: 5 }))).toBeTrue();
        expect(service.resetState()).toBeTrue();
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('restartState', () => {
        expect(service.setState(() => ({ count: 5 }))).toBeTrue();
        expect(service.restartState()).toBeTrue();
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 1 });
    });

    it('deepFreeze: DEV', () => {
        try {
            expect(service['devMode']).toEqual(true);
            const state = service.getFirstState();
            expect(state).toEqual({ count: 1 });
            (state as any).count = 2;
            expect(true).toEqual(false);
        } catch (error: any) {
            expect(error.message).toEqual('Cannot assign to read only property \'count\' of object \'[object Object]\'');
        } finally {
            service['devMode'] = true;
            expect(service['devMode']).toEqual(true);
        }
    });

    it('deepFreeze: PROD', () => {
        try {
            expect(service['devMode']).toEqual(true);
            service['devMode'] = false;
            expect(service['devMode']).toEqual(false);
            const state = service.getFirstState();
            expect(state).toEqual({ count: 1 });
            (state as any).count = 3;
            expect(state).toEqual({ count: 3 });
        } catch (error: any) {
            expect(error).toBeUndefined();
        } finally {
            service['devMode'] = true;
            expect(service['devMode']).toEqual(true);
        }
    });

});

@Component({
    selector: 'ng-test',
    template: `{{counter$ | async}}`,
    standalone: true,
    imports: [CommonModule]
})
export class TestComponent extends NgSimpleStateBaseRxjsStore<CounterState> {

    public counter$: Observable<number> = this.selectState(state => state.count);

    protected storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'TestComponent'
        };
    }

    initialState(): CounterState {
        return {
            count: 0
        };
    }

    increment(): boolean {
        return this.setState(state => ({ count: state.count + 1 }));
    }

    decrement(): boolean {
        return this.setState(state => ({ count: state.count - 1 }));
    }
}
describe('NgSimpleStateBaseRxjsStore: Component', () => {

    let fixture: ComponentFixture<TestComponent>;
    let debugElement: DebugElement;
    let element: HTMLElement;
    let component: TestComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestComponent]
        });
        fixture = TestBed.createComponent(TestComponent);
        debugElement = fixture.debugElement;
        component = fixture.componentInstance;
        element = debugElement.nativeElement;
    });

    afterEach(() => {
        document.body.removeChild(element);
    });

    it('initialState', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        expect(element.textContent?.trim()).toBe('0');
    }));

    it('increment', fakeAsync(() => {
        expect(component.increment()).toBeTrue();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        expect(element.textContent?.trim()).toBe('1');
    }));

    it('decrement', fakeAsync(() => {
        expect(component.decrement()).toBeTrue();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        expect(element.textContent?.trim()).toBe('-1');
    }));
});
