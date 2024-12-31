import { Injectable } from '@angular/core';
import {
  NgSimpleStateBaseRxjsStore,
  NgSimpleStateStoreConfig
} from 'projects/ng-simple-state/src/public-api';

export interface Todo {
  id: number;
  name: string;
  completed: boolean;
}

export type TodoState = Array<Todo>;

@Injectable()
export class TodoStore extends NgSimpleStateBaseRxjsStore<TodoState> {
  storeConfig(): NgSimpleStateStoreConfig<TodoState> {
    return {
      storeName: 'TodoStore'
    };
  }

  initialState(): TodoState {
    return [
      { id: 0, name: 'foo', completed: false },
      { id: 1, name: 'bar', completed: true },
    ];
  }

  add(name: string, completed: boolean = false): void {
    this.setState((state) => [
      ...state,
      { name, completed, id: state.length + 1 },
    ]);
  }

  delete(id: number): void {
    this.setState((state) => state.filter((item) => item.id !== id));
  }

  setComplete(id: number, completed: boolean = true): void {
    this.setState((state) =>
      state.map((item) => (item.id === id ? { ...item, completed } : item))
    );
  }
}
