import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public counter$: Observable<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectState(state => state.count);
  }
}
