/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, DebugElement, Injectable, Injector, Signal } from '@angular/core';
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from './ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from './../ng-simple-state-models';
import { NgSimpleStateModule } from './../ng-simple-state.module';
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

    beforeEach(inject([Injector], (injector: Injector) => {
        service = new CounterStore(injector);
    }));


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

    it('no changes', () => {
        expect(service.setState(state => state)).toBeFalse();
    });

    it('get state', () => {
        const state = service.state;
        expect(state().count).toBe(1);
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 1 });

    });

    it('decrement -> setState', () => {
        expect(service.setState(() => ({ count: 5 }))).toBeTrue();
        const value = service.selectState(state => state.count)
        expect(value()).toBe(5);
        expect(service.getFirstState()).toEqual({ count: 1 });
        expect(service.getCurrentState()).toEqual({ count: 5 });

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
    template: `{{counter$()}}`
})
export class TestComponent extends NgSimpleStateBaseSignalStore<CounterState> {

    public counter$: Signal<number> = this.selectState(state => state.count);

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
describe('NgSimpleStateBaseSignalStore: Component', () => {

    let fixture: ComponentFixture<TestComponent>;
    let debugElement: DebugElement;
    let element: HTMLElement;
    let component: TestComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent],
            imports: [NgSimpleStateModule, CommonModule]
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
