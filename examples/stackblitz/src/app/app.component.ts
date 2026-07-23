import { Component, inject } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  // the store is provided here, so its lifetime is the component's
  providers: [CounterStore],
  template: `
    <button (click)="store.decrement()">-</button>
    <span>{{ count() }}</span>
    <button (click)="store.increment()">+</button>
  `,
})
export class AppComponent {
  protected readonly store = inject(CounterStore);
  protected readonly count = this.store.selectCount();
}
