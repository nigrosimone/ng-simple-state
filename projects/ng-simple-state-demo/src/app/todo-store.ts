import { Injectable } from '@angular/core';
import { NgSimpleStateBaseStore } from 'projects/ng-simple-state/src/public-api';
import { Observable } from 'rxjs';

export interface Todo {
  id: number;
  name: string;
  completed: boolean;
}

export type TodoState = Array<Todo>;

@Injectable()
export class TodoStore extends NgSimpleStateBaseStore<TodoState> {

  initialState(): TodoState {
    return new Array();
  }

  add(todo: Omit<Todo, 'id'>): void {
    this.setState(state =>  [...state, {...todo, id: Date.now()}]);
  }

  delete(id: number): void {
    this.setState(state => state.filter(item => item.id !== id) );
  }

  setComplete(id: number, completed: boolean = true): void {
    this.setState(state => state.map(item => item.id === id ? {...item, completed} : item) );
  }
}
