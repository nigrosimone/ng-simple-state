import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.sass']
})
export class CounterComponent {

  public counter$: Observable<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectCount();
  }

}
