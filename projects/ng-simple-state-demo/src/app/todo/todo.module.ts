import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoComponent } from './todo.component';
import { TodoRoutingModule } from './todo-routing.module';

@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    CommonModule,
    TodoRoutingModule
  ],
  exports: [
    TodoComponent
  ]
})
export class TodoModule { }
