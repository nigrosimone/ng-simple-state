import { CommonModule } from '@angular/common';
import { Component, DebugElement, Injectable, Injector } from '@angular/core';
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { NgSimpleStateBaseStore } from './ng-simple-state-base-store';
import { NgSimpleStateModule } from './ng-simple-state.module';
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

    increment(increment: number = 1): boolean {
        return this.setState(state => ({ count: state.count + increment }));
    }

    decrement(decrement: number = 1): boolean {
        return this.setState(state => ({ count: state.count - decrement }));
    }
}


describe('NgSimpleStateBaseStore: Service', () => {

    let service: CounterStore;

    beforeEach(inject([Injector], (injector: Injector) => {
        service = new CounterStore(injector);
    }));


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
});

@Component({
    selector: 'ng-test',
    template: `{{counter$ | async}}`
})
export class TestComponent extends NgSimpleStateBaseStore<CounterState> {

    public counter$: Observable<number> = this.selectState(state => state.count);

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
describe('NgSimpleStateBaseStore: Component', () => {

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
