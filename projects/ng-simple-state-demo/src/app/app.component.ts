import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';
import { Todo, TodoStore } from './todo-store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TodoStore]
})
export class AppComponent {
  public counter$: Observable<number>;
  public todoList$: Observable<Todo[]>;

  constructor(public counterStore: CounterStore, public todoStore: TodoStore) {
    this.counter$ = this.counterStore.selectCount();
    this.todoList$ = this.todoStore.selectState();
  }
}
