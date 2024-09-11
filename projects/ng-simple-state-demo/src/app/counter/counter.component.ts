import { Component, Signal } from '@angular/core';
import { CounterStore } from './counter-store';
import { CommonModule } from '@angular/common';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.sass'],
  standalone: true,
  providers: [CounterStore],
  imports: [CommonModule]
})
export class CounterComponent {

  public counter$: Signal<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectCount();
  }

}
