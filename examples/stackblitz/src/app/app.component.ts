import {
  ChangeDetectionStrategy,
  Component,
  model,
  inject,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CounterStore, type CounterState } from './counter-store';
import {
  NG_SIMPLE_STATE_UNDO_REDO,
  NgSimpleStateUndoRedoPlugin,
} from 'ng-simple-state';

@Component({
  selector: 'app-root',
  template: `
    <h1>Counter: {{ counter() }}</h1>
    <button (click)="store.decrement(step())">[-{{step()}}] Decrement</button> &nbsp;
    <input type="number" [ngModel]="step()" (ngModelChange)="store.setStep(+$event)" style="width:50px" /> &nbsp;
    <button (click)="store.increment(step())">[+{{step()}}] Increment</button> <br />
    <br />
    Restart the store to initial state provided from <em>initialState()</em> method<br />
    <button (click)="store.restartState()">Restart to "{{store.initialState().count}}"</button> <br /><br />
   Reset store to first loaded store state: the last saved state into local storage or the initial state provided from  <em>initialState()</em> method.<br />
    <button (click)="store.resetState()">Reset to "{{store.getFirstState()?.count}}"</button><br /><br />
    <button [disabled]="!canUndo()" (click)="history.undo()">Undo</button>
    <button [disabled]="!canRedo()" (click)="history.redo()">Redo</button>
    <br /><br /><br />
    <code>{{ jsonState() }}</code>
  `,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly store = inject(CounterStore);
  private readonly undoRedo = inject<NgSimpleStateUndoRedoPlugin<CounterState>>(
    NG_SIMPLE_STATE_UNDO_REDO
  );

  protected readonly step = this.store.selectStep();
  protected readonly counter = this.store.selectCount();

  protected readonly history = this.undoRedo.forStore(this.store);
  protected readonly canUndo = this.history.selectCanUndo();
  protected readonly canRedo = this.history.selectCanRedo();

  private readonly state = this.store.selectState();
  protected readonly jsonState = computed(() =>
    JSON.stringify(this.state(), null, 2)
  );
}
/**
 * NgSimpleState Demo
 * Simple state management in Angular with only Services and Signal.
 * See: https://www.npmjs.com/package/ng-simple-state
 */
