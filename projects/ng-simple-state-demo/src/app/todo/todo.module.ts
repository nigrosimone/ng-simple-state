import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoComponent } from './todo.component';
import { TodoStore } from './todo-store';

@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TodoComponent
  ]
})
export class TodoModule { }
