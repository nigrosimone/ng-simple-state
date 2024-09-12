import { Component, inject, Signal } from '@angular/core';
import { CounterStore } from './counter-store';
import { CommonModule } from '@angular/common';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-counter',
  template: `
  <h1>Counter: {{ counter() }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.resetState()">Reset</button>
  <button (click)="counterStore.increment()">Increment</button>`,
  standalone: true,
  providers: [CounterStore],
  imports: [CommonModule]
})
export class CounterComponent {
  public counterStore = inject(CounterStore);
  public counter: Signal<number> = this.counterStore.selectCount()
}
