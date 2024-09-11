
import { NgSimpleStateBaseSignalStore, NgSimpleStateModule, NgSimpleStateStoreConfig } from '../../../../ng-simple-state/src/public-api';
import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CounterState {
    count: number;
}

let id = 0;

@Component({
    selector: 'ng-test',
    standalone: true,
    imports: [
        CommonModule,
        NgSimpleStateModule
    ],
    template: `
        {{ id }} - 
        {{counter$()}}
        <button (click)="increment()">+</button>
        <button (click)="decrement()">-</button>
    `
})
export class TestComponent extends NgSimpleStateBaseSignalStore<CounterState> {

    public id = id;

    public counter$: Signal<number> = this.selectState(state => state.count);

    protected storeConfig(): NgSimpleStateStoreConfig {
        id++;
        return {
            storeName: 'TestComponent-'+id
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
