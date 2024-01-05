
import { NgSimpleStateBaseSignalStore, NgSimpleStateModule, NgSimpleStateStoreConfig } from '../../../../ng-simple-state/src/public-api';
import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CounterState {
    count: number;
}

@Component({
    selector: 'ng-test',
    standalone: true,
    imports: [
        CommonModule,
        NgSimpleStateModule
    ],
    template: `
        {{counter$()}}
        <button (click)="increment()">+</button>
        <button (click)="decrement()">-</button>
    `
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

    increment(): void {
        this.setState(state => ({ count: state.count + 1 }));
    }

    decrement(): void {
        this.setState(state => ({ count: state.count - 1 }));
    }
}
