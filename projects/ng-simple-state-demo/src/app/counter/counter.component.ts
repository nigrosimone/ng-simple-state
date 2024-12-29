import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  model,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CounterStoreSignal } from './counter-store-signal';
import { CounterStoreRxjs } from './counter-store-rxjs';
import { CounterState } from './state-model';


@Component({
  selector: 'app-counter',
  template: `
    <!-- Signal version of the store -->
    <h1>Signal Counter: {{ counterSig() }}</h1>
    <button (click)="storeSignal.decrement(step())">[-{{step()}}] Decrement</button> &nbsp;
    <input type="number" [(ngModel)]="step" style="width:50px" /> &nbsp;
    <button (click)="storeSignal.increment(step())">[+{{step()}}] Increment</button> <br />
    <br />
    <em>Restart the store to initial state provided from initialState() method</em><br />
    <button (click)="storeSignal.restartState()">Restart to "{{initialStateSig.count}}"</button> <br /><br />
    <em>Reset store to first loaded store state: the last saved state into local storage or the initial state provided from initialState() method.</em><br />
    <button (click)="storeSignal.resetState()">Reset to "{{firstStateSig?.count}}"</button>

    <hr />
    <!-- RxJS version of the store -->  
    <h1>RxJS Counter: {{ counterRxjs | async }}</h1>
    <button (click)="storeRxjs.decrement(step())">[-{{step()}}] Decrement</button> &nbsp;
    <input type="number" [(ngModel)]="step" style="width:50px" /> &nbsp;
    <button (click)="storeRxjs.increment(step())">[+{{step()}}] Increment</button> <br />
    <br />
    <em>Restart the store to initial state provided from initialState() method</em><br />
    <button (click)="storeRxjs.restartState()">Restart to "{{initialStateRxjs.count}}"</button> <br /><br />
    <em>Reset store to first loaded store state: the last saved state into local storage or the initial state provided from initialState() method.</em><br />
    <button (click)="storeRxjs.resetState()">Reset to "{{firstStateRxjs?.count}}"</button>
  `,
  imports: [CommonModule, FormsModule],
  providers: [CounterStoreSignal, CounterStoreRxjs],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  public storeSignal = inject(CounterStoreSignal);
  public storeRxjs = inject(CounterStoreRxjs);

  public step = model(1);

  // Signal version of the store
  public counterSig: Signal<number> = this.storeSignal.selectCount();
  public firstStateSig: CounterState | null = this.storeSignal.getFirstState();
  public initialStateSig: CounterState = this.storeSignal.initialState();
  // RxJS version of the store
  public counterRxjs: Observable<number> = this.storeRxjs.selectCount();
  public firstStateRxjs: CounterState | null = this.storeRxjs.getFirstState();
  public initialStateRxjs: CounterState = this.storeRxjs.initialState();
}
/**
 * NgSimpleState Demo
 * Simple state management in Angular with only Services and RxJS or Signal.
 * See: https://www.npmjs.com/package/ng-simple-state
 */
