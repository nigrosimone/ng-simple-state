import { Component, inject, model, Signal } from '@angular/core';
import { Todo, TodoStore } from './todo-store';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-todo',
  template: `
  <input [(ngModel)]="newTodo"><button (click)="todoStore.add(newTodo()); newTodo.set('')" [disabled]="!newTodo()">Add</button>
  <ol>
      <li *ngFor="let todo of todoList$(); trackBy: todoStore.trackBy">
          <input type="checkbox" [checked]="todo.completed" (change)="todoStore.setComplete(todo.id, $any($event.currentTarget).checked)">
          {{ todo.name }} 
          <button (click)="todoStore.delete(todo.id)">&#10005;</button>
      </li>
  </ol>`,
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [TodoStore]
})
export class TodoComponent {
  public todoStore: TodoStore = inject(TodoStore);
  public todoList$: Signal<Todo[]> = this.todoStore.selectState();
  public newTodo = model<string>('');
}
