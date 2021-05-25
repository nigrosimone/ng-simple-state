import { Injectable } from '@angular/core';
import { NgSimpleStateBaseStore } from 'projects/ng-simple-state/src/public-api';

export interface Todo {
  id: number;
  name: string;
  completed: boolean;
}

export type TodoState = Array<Todo>;

@Injectable()
export class TodoStore extends NgSimpleStateBaseStore<TodoState> {

  initialState(): TodoState {
    return [];
  }

  add(name: string): void {
    this.setState(state =>  [...state, {name, completed: false, id: Date.now()}]);
  }

  delete(id: number): void {
    this.setState(state => state.filter(item => item.id !== id) );
  }

  setComplete(id: number, completed: boolean = true): void {
    this.setState(state => state.map(item => item.id === id ? {...item, completed} : item) );
  }
}
