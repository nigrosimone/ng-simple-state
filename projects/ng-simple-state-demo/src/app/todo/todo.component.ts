import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo, TodoStore } from './todo-store';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.sass'],
  providers: [TodoStore]
})
export class TodoComponent {
  public todoList$: Observable<Todo[]>;
  public newTodo = '';


  constructor(public todoStore: TodoStore) {
    this.todoList$ = this.todoStore.selectState();
  }
}
