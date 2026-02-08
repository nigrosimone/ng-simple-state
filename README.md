# NgSimpleState [![Build Status](https://app.travis-ci.com/nigrosimone/ng-simple-state.svg?branch=main)](https://app.travis-ci.com/nigrosimone/ng-simple-state) [![Coverage Status](https://coveralls.io/repos/github/nigrosimone/ng-simple-state/badge.svg?branch=main)](https://coveralls.io/github/nigrosimone/ng-simple-state?branch=main) [![NPM version](https://img.shields.io/npm/v/ng-simple-state.svg)](https://www.npmjs.com/package/ng-simple-state) [![Maintainability](https://api.codeclimate.com/v1/badges/1bfc363a95053ecc3429/maintainability)](https://codeclimate.com/github/nigrosimone/ng-simple-state/maintainability)

Simple state management in Angular with only Services and RxJS or Signal.

## Description

Sharing state between components as simple as possible and leverage the good parts of component state and Angular's dependency injection system.

See the demos:
 - [Counter](https://stackblitz.com/edit/demo-ng-simple-state?file=src%2Fapp%2Fapp.component.ts)
 - [Tour of heroes](https://stackblitz.com/edit/ng-simple-state-tour-of-heroes?file=src%2Fapp%2Fhero.service.ts)
 - [To Do List](https://stackblitz.com/edit/ng-simple-state-todo?file=src%2Fapp%2Fapp.component.ts)

## Get Started

### Step 1: install `ng-simple-state`

```bash
npm i ng-simple-state
```

### Step 2: Import `provideNgSimpleState` into your providers

`provideNgSimpleState` has some global optional config defined by `NgSimpleStateConfig` interface:

| Option                 | Description                                                                                     | Default          |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| *enableDevTool*        | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`          |
| *persistentStorage*    | Set the persistent storage `local` or `session`.                                                | undefined        |
| *comparator*           | A function used to compare the previous and current state for equality.                         | `a === b`        |
| *serializeState*       | A function used to serialize the state to a string.                                             | `JSON.stringify` |
| *deserializeState*     | A function used to deserialize the state from a string.                                         | `JSON.parse`     |
| *plugins*              | Array of plugins to extend store functionality.                                                 | `[]`             |
| *immerProduce*         | Custom Immer produce function for immutable updates.                                            | undefined        |

_Side note: each store can be override the global configuration implementing `storeConfig()` method (see "Override global config")._

```ts
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { provideNgSimpleState } from 'ng-simple-state';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      persistentStorage: 'local'
    })
  ]
});
```

### Step 3: Chose your store

There are two type of store `NgSimpleStateBaseRxjsStore` based on RxJS `BehaviorSubject` and `NgSimpleStateBaseSignalStore` based on Angular `Signal`:

- [RxJS Store](#rxjs-store)
- [Signal Store](#signal-store)

## RxJS Store

This is an example for a counter store in a `src/app/counter-store.ts` file. 
Obviously, you can create every store you want with every complexity you need.

1) Define your state interface, eg.:

```ts
export interface CounterState {
    count: number;
}
```

2) Define your store service by extending `NgSimpleStateBaseRxjsStore`, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseRxjsStore } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {
 
}
```

3) Implement `initialState()` and `storeConfig()` methods and provide the initial state of the store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }
  
  initialState(): CounterState {
    return {
      count: 0
    };
  }

}
```

4) Implement one or more selectors of the partial state you want, in this example `selectCount()` eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }
  
  initialState(): CounterState {
    return {
      count: 0
    };
  }

  selectCount(): Observable<number> {
    return this.selectState(state => state.count);
  }
}
```
 
5) Implement one or more actions for change the store state, in this example `increment()` and `decrement()` eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseRxjsStore, NgSimpleStateStoreConfig } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }

  initialState(): CounterState {
    return {
      count: 0
    };
  }

  selectCount(): Observable<number> {
    return this.selectState(state => state.count);
  }

  increment(increment: number = 1): void {
    this.setState(state => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.setState(state => ({ count: state.count - decrement }));
  }
}
```

#### Step 3: Inject your store into the providers, eg.:

```ts
import { Component } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  imports: [CounterStore]
})
export class AppComponent {

}
```

#### Step 4: Use your store into the components, eg.:

```ts
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  imports: [CounterStore],
  template: `
  <h1>Counter: {{ counter$ | async }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.resetState()">Reset</button>
  <button (click)="counterStore.increment()">Increment</button>
  `,
})
export class AppComponent {
  public counterStore = inject(CounterStore);
  public counter$: Observable<number> = this.counterStore.selectCount();
}
```

#### That's all!

![alt text](https://github.com/nigrosimone/ng-simple-state/blob/main/projects/ng-simple-state-demo/src/assets/dev-tool.gif?raw=true)

### Manage component state without service

If you want manage just a component state without make a new service, your component can extend directly `NgSimpleStateBaseRxjsStore`:

```ts
import { Component } from '@angular/core';
import { NgSimpleStateBaseRxjsStore } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
    count: number;
}

@Component({
    selector: 'app-counter',
    template: `
        {{counter$ | async}}
        <button (click)="increment()">+</button>
        <button (click)="decrement()">-</button>
    `
})
export class CounterComponent extends NgSimpleStateBaseRxjsStore<CounterState> {

    public counter$: Observable<number> = this.selectState(state => state.count);

    storeConfig(): NgSimpleStateStoreConfig<CounterState> {
      return {
        storeName: 'CounterComponent'
      };
    }

    initialState(): CounterState {
        return {
            count: 0
        };
    }

    increment(): void {
        this.setState(state => ({ count: state.count + 1 }));
    }

    decrement(): void {
        this.setState(state => ({ count: state.count - 1 }));
    }
}
```

### Override global config

If you need to override the global configuration provided by `provideNgSimpleState()` you can implement `storeConfig()` and return a specific configuration for the single store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateStoreConfig } from 'ng-simple-state';


@Injectable()
export class CounterStore extends NgSimpleStateBaseRxjsStore<CounterState> {

  override storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      persistentStorage: 'session', // persistentStorage can be 'session' or 'local' (default is localStorage)
      storeName: 'CounterStore2', // set a specific name for this store (must be be unique)
    }
  }
}
```

The options are defined by `NgSimpleStateStoreConfig` interface:

| Option               | Description                                                                                     | Default          |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| *enableDevTool*      | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`          |
| *storeName*          | The store name.                                                                                 | undefined        |
| *persistentStorage*  | Set the persistent storage `local` or `session`                                                 | undefined        |
| *comparator*         | A function used to compare the previous and current state for equality.                         | `a === b`        |
| *serializeState*     | A function used to serialize the state to a string.                                             | `JSON.stringify` |
| *deserializeState*   | A function used to deserialize the state from a string.                                         | `JSON.parse`     |


### Testing

`ng-simple-state` is simple to test. Eg.:

```ts
import { TestBed } from '@angular/core/testing';
import { provideNgSimpleState } from 'ng-simple-state';
import { CounterStore } from './counter-store';

describe('CounterStore', () => {

  let counterStore: CounterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNgSimpleState({
          enableDevTool: false
        }),
        CounterStore
      ]
    });

    counterStore = TestBed.inject(CounterStore);
  });

  it('initialState', () => {
    expect(counterStore.getCurrentState()).toEqual({ count: 0 });
  });

  it('increment', () => {
    counterStore.increment();
    expect(counterStore.getCurrentState()).toEqual({ count: 1 });
  });

  it('decrement', () => {
    counterStore.decrement();
    expect(counterStore.getCurrentState()).toEqual({ count: -1 });
  });

  it('selectCount', (done) => {
    counterStore.selectCount().subscribe(value => {
      expect(value).toBe(0);
      done();
    });
  });

});
```

### Example: array store

This is an example for a todo list store in a `src/app/todo-store.ts` file. 

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseRxjsStore } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface Todo {
  id: number;
  name: string;
  completed: boolean;
}

export type TodoState = Array<Todo>;

@Injectable()
export class TodoStore extends NgSimpleStateBaseRxjsStore<TodoState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'TodoStore'
    };
  }

  initialState(): TodoState {
    return [];
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
```

usage:

```ts
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo, TodoStore } from './todo-store';

@Component({
  selector: 'app-root',
  template: `
    <input #newTodo> <button (click)="todoStore.add({name: newTodo.value, completed: false})">Add todo</button>
    <ol>
      @for(todo of todoList$ | async; track todo.id) {
        <li>
            @if(todo.completed) {
              ✅
            } 
            {{ todo.name }} 
            <button (click)="todoStore.setComplete(todo.id, !todo.completed)">Mark as {{ todo.completed ? 'Not completed' : 'Completed' }}</button> 
            <button (click)="todoStore.delete(todo.id)">Delete</button>
        </li>
      }
    </ol>
  `,
  providers: [TodoStore]
})
export class AppComponent {
  public todoStore = inject(TodoStore);
  public todoList$: Observable<Todo[]> = this.todoStore.selectState();
}
```


### NgSimpleStateBaseRxjsStore API

```ts
@Injectable()
@Directive()
export abstract class NgSimpleStateBaseRxjsStore<S extends object | Array<any>> implements OnDestroy {

    /**
     * Return the observable of the state
     * @returns Observable of the state
     */
    public get state(): BehaviorSubject<S>;

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    ngOnDestroy(): void;

    /**
     * Reset store to first loaded store state:
     *  - the last saved state
     *  - otherwise the initial state provided from `initialState()` method.
     */
    resetState(): boolean;

    /**
     * Restart the store to initial state provided from `initialState()` method
     */
    restartState(): boolean;

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    storeConfig(): NgSimpleStateStoreConfig<S>;

    /**
     * Set into the store the initial state
     * @returns The state object
     */
    initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    selectState<K>(selectFn?: (state: Readonly<S>) => K, comparator?: (previous: K, current: K) => boolean): Observable<K>;

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S>;

    /**
     * Return the first loaded store state:
     * the last saved state
     * otherwise the initial state provided from `initialState()` method.
     * @returns The first state
     */
    getFirstState(): Readonly<S> | null;

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(newState: Partial<S>, actionName?: string): boolean;
    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean;

    /**
     * Replace state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(newState: S, actionName?: string): boolean;
    /**
     * Replace state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): boolean;
}
```
## Signal Store

This is an example for a counter store in a `src/app/counter-store.ts` file. 
Obviously, you can create every store you want with every complexity you need.

1) Define your state interface, eg.:

```ts
export interface CounterState {
    count: number;
}
```

2) Define your store service by extending `NgSimpleStateBaseSignalStore`, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseSignalStore } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {
 
}
```

3) Implement `initialState()` and `storeConfig()` methods and provide the initial state of the store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }
  
  initialState(): CounterState {
    return {
      count: 0
    };
  }

}
```

4) Implement one or more selectors of the partial state you want, in this example `selectCount()` eg.:

```ts
import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }
  
  initialState(): CounterState {
    return {
      count: 0
    };
  }

  selectCount(): Signal<number> {
    return this.selectState(state => state.count);
  }
}
```
 
5) Implement one or more actions for change the store state, in this example `increment()` and `decrement()` eg.:

```ts
import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'CounterStore'
    };
  }

  initialState(): CounterState {
    return {
      count: 0
    };
  }

  selectCount(): Signal<number> {
    return this.selectState(state => state.count);
  }

  increment(increment: number = 1): void {
    this.setState(state => ({ count: state.count + increment }));
  }

  decrement(decrement: number = 1): void {
    this.setState(state => ({ count: state.count - decrement }));
  }
}
```

#### Step 3: Inject your store into the providers, eg.:

```ts
import { Component } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  imports: [CounterStore]
})
export class AppComponent {

}
```

#### Step 4: Use your store into the components, eg.:

```ts
import { Component, Signal, inject } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  template: `
  <h1>Counter: {{ counterSig() }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.resetState()">Reset</button>
  <button (click)="counterStore.increment()">Increment</button>
  `,
})
export class AppComponent {
  public counterStore = inject(CounterStore);
  public counterSig: Signal<number> = this.counterStore.selectCount();
}
```

#### That's all!

![alt text](https://github.com/nigrosimone/ng-simple-state/blob/main/projects/ng-simple-state-demo/src/assets/dev-tool.gif?raw=true)

### Manage component state without service

If you want manage just a component state without make a new service, your component can extend directly `NgSimpleStateBaseSignalStore`:

```ts
import { Component, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore } from 'ng-simple-state';

export interface CounterState {
    count: number;
}

@Component({
    selector: 'app-counter',
    template: `
        {{counterSig()}}
        <button (click)="increment()">+</button>
        <button (click)="decrement()">-</button>
    `
})
export class CounterComponent extends NgSimpleStateBaseSignalStore<CounterState> {

    public counterSig: Signal<number> = this.selectState(state => state.count);

    storeConfig(): NgSimpleStateStoreConfig<CounterState> {
      return {
        storeName: 'CounterComponent'
      };
    }

    initialState(): CounterState {
        return {
            count: 0
        };
    }

    increment(): void {
        this.setState(state => ({ count: state.count + 1 }));
    }

    decrement(): void {
        this.setState(state => ({ count: state.count - 1 }));
    }
}
```

### Override global config

If you need to override the global configuration provided by `provideNgSimpleState()` you can implement `storeConfig()` and return a specific configuration for the single store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateStoreConfig } from 'ng-simple-state';


@Injectable()
export class CounterStore extends NgSimpleStateBaseSignalStore<CounterState> {

  override storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      persistentStorage: 'session', // persistentStorage can be 'session' or 'local' (default is localStorage)
      storeName: 'CounterStore2', // set a specific name for this store (must be be unique)
    }
  }
}
```

The options are defined by `NgSimpleStateStoreConfig` interface:

| Option               | Description                                                                                     | Default          |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| *enableDevTool*      | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`          |
| *storeName*          | The store name.                                                                                 | undefined        |
| *persistentStorage*  | Set the persistent storage `local` or `session`                                                 | undefined        |
| *comparator*         | A function used to compare the previous and current state for equality.                         | `a === b`        |
| *serializeState*     | A function used to serialize the state to a string.                                             | `JSON.stringify` |
| *deserializeState*   | A function used to deserialize the state from a string.                                         | `JSON.parse`     |

### Testing

`ng-simple-state` is simple to test. Eg.:

```ts
import { TestBed } from '@angular/core/testing';
import { provideNgSimpleState } from 'ng-simple-state';
import { CounterStore } from './counter-store';

describe('CounterStore', () => {

  let counterStore: CounterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNgSimpleState({
          enableDevTool: false
        }),
        CounterStore
      ]
    });

    counterStore = TestBed.inject(CounterStore);
  });

  it('initialState', () => {
    expect(counterStore.getCurrentState()).toEqual({ count: 0 });
  });

  it('increment', () => {
    counterStore.increment();
    expect(counterStore.getCurrentState()).toEqual({ count: 1 });
  });

  it('decrement', () => {
    counterStore.decrement();
    expect(counterStore.getCurrentState()).toEqual({ count: -1 });
  });

  it('selectCount', () => {
    const valueSig = counterStore.selectCount();
    expect(valueSig()).toBe(0);
  });

});
```

### Example: array store

This is an example for a todo list store in a `src/app/todo-store.ts` file. 

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseSignalStore } from 'ng-simple-state';

export interface Todo {
  id: number;
  name: string;
  completed: boolean;
}

export type TodoState = Array<Todo>;

@Injectable()
export class TodoStore extends NgSimpleStateBaseSignalStore<TodoState> {

  storeConfig(): NgSimpleStateStoreConfig<CounterState> {
    return {
      storeName: 'TodoStore'
    };
  }

  initialState(): TodoState {
    return [];
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
```

usage:

```ts
import { Component, Signal, inject } from '@angular/core';
import { Todo, TodoStore } from './todo-store';

@Component({
  selector: 'app-root',
  template: `
    <input #newTodo> <button (click)="todoStore.add({name: newTodo.value, completed: false})">Add todo</button>
    <ol>
      @for(todo of todoListSig(); track todo.id) {
        <li>
            @if(todo.completed) {
              ✅
            }
            {{ todo.name }} 
            <button (click)="todoStore.setComplete(todo.id, !todo.completed)">Mark as {{ todo.completed ? 'Not completed' : 'Completed' }}</button> 
            <button (click)="todoStore.delete(todo.id)">Delete</button>
        </li>
      }
    </ol>
  `,
  providers: [TodoStore]
})
export class AppComponent {
  public todoStore = inject(TodoStore);
  public todoListSig: Signal<Todo[]> = this.todoStore.selectState();
}
```


### NgSimpleStateBaseSignalStore API

```ts
@Injectable()
@Directive()
export abstract class NgSimpleStateBaseSignalStore<S extends object | Array<any>> implements OnDestroy {

    /**
     * Return the Signal of the state
     * @returns Signal of the state
     */
    public get state(): Signal<S>;

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    ngOnDestroy(): void;

    /**
     * Reset store to first loaded store state:
     *  - the last saved state
     *  - otherwise the initial state provided from `initialState()` method.
     */
    resetState(): boolean;

    /**
     * Restart the store to initial state provided from `initialState()` method
     */
    restartState(): boolean;

    /**
     * Override this method for set a specific config for the store
     * @returns NgSimpleStateStoreConfig
     */
    storeConfig(): NgSimpleStateStoreConfig<S>;

    /**
     * Set into the store the initial state
     * @returns The state object
     */
    initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Signal of the selected state
     */
    selectState<K>(selectFn?: (state: Readonly<S>) => K, comparator?: (previous: K, current: K) => boolean): Signal<K>;

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S>;

    /**
     * Return the first loaded store state:
     * the last saved state
     * otherwise the initial state provided from `initialState()` method.
     * @returns The first state
     */
    getFirstState(): Readonly<S> | null;

    /**
     * Set a new state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(newState: Partial<S>, actionName?: string): boolean;
    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean;

    /**
     * Replace state
     * @param newState New state
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(newState: S, actionName?: string): boolean;
    /**
     * Replace state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    replaceState(stateFn: NgSimpleStateReplaceState<S>, actionName?: string): boolean;
}
```

### Schematics CLI

Generate stores quickly using Angular CLI:

```bash
# Generate a Signal store (recommended)
ng generate ng-simple-state:store my-feature

# Generate an RxJS store
ng generate ng-simple-state:store my-feature --type=rxjs

# With persistent storage
ng generate ng-simple-state:store my-feature --persistentStorage=local
```

### Effect Management

Effects are side-effect functions that react to state changes. They are useful for logging, analytics, syncing with external services, or triggering additional actions.

Each effect has a **name** (any unique string you choose) that serves as an identifier, you can use it later to destroy the effect with `destroyEffect(name)`. If you create a new effect with the same name, the previous one is automatically cleaned up.

| Method | Description |
| --- | --- |
| `createEffect(name, effectFn)` | Runs `effectFn(state)` on every state change |
| `createSelectorEffect(name, selector, effectFn)` | Runs `effectFn(selected)` only when the selected slice changes |
| `destroyEffect(name)` | Destroys a specific effect by its name |

#### Complete Store Example with Effects

```ts
import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface UserState {
  user: { id: number; name: string } | null;
  isLoading: boolean;
  lastActivity: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore extends NgSimpleStateBaseSignalStore<UserState> {

  storeConfig(): NgSimpleStateStoreConfig<UserState> {
    return { storeName: 'UserStore' };
  }

  initialState(): UserState {
    return { user: null, isLoading: false, lastActivity: '' };
  }

  constructor() {
    super();

    this.createEffect('logger', (state) => {
      console.log('[UserStore] State updated:', state);
    });

    //  effect runs only when state.user changes
    this.createSelectorEffect(
      'userChanged',
      state => state.user,
      (user) => {
        if (user) {
          console.log('User logged in:', user.name);
        } else {
          console.log('User logged out');
        }
      }
    );
  }

  selectUser(): Signal<{ id: number; name: string } | null> {
    return this.selectState(state => state.user);
  }

  login(user: { id: number; name: string }): void {
    this.setState({ user, isLoading: false, lastActivity: 'login' });
  }

  logout(): void {
    this.setState({ user: null, lastActivity: 'logout' });
  }

  disableLogging(): void {
    this.destroyEffect('logger');
  }
}
```

#### Usage in Component

```ts
@Component({
  selector: 'app-user',
  template: `
    @if (user()) {
      <p>Welcome, {{ user()?.name }}!</p>
      <button (click)="store.logout()">Logout</button>
    } @else {
      <button (click)="store.login({ id: 1, name: 'John' })">Login</button>
    }
  `
})
export class UserComponent {
  store = inject(UserStore);
  user = this.store.selectUser();
}
```

### Linked Signals

Create reactive linked signals that derive from store state with custom computation:

```ts
import { Injectable, Signal, computed } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface ProfileState {
  firstName: string;
  lastName: string;
  age: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore extends NgSimpleStateBaseSignalStore<ProfileState> {

  storeConfig(): NgSimpleStateStoreConfig<ProfileState> {
    return { storeName: 'ProfileStore' };
  }

  initialState(): ProfileState {
    return { firstName: '', lastName: '', age: 0 };
  }

  // Linked signal with custom computation
  fullName = this.linkedState({
    source: state => ({ first: state.firstName, last: state.lastName }),
    computation: (name) => `${name.first} ${name.last}`.trim()
  });

  selectFirstName(): Signal<string> {
    return this.selectState(state => state.firstName);
  }

  setName(firstName: string, lastName: string): void {
    this.setState({ firstName, lastName });
  }
}
```

Usage in component:

```ts
@Component({
  selector: 'app-profile',
  template: `
    <p>Full Name: {{ store.fullName() }}</p>
    <input [value]="firstName()" (input)="updateFirstName($event)" placeholder="First name" />
    <input [value]="lastName()" (input)="updateLastName($event)" placeholder="Last name" />
  `
})
export class ProfileComponent {
  store = inject(ProfileStore);
  firstName = this.store.selectFirstName();
  lastName = this.store.selectState(s => s.lastName);

  updateFirstName(event: Event): void {
    this.store.setName((event.target as HTMLInputElement).value, this.lastName());
  }

  updateLastName(event: Event): void {
    this.store.setName(this.firstName(), (event.target as HTMLInputElement).value);
  }
}
```

### Plugin System

Extend store functionality with plugins. Plugins can intercept state changes, perform side effects, and add features like undo/redo.

#### undoRedoPlugin

Enable state history with undo/redo functionality:

```ts
import { isDevMode } from '@angular/core';
import { provideNgSimpleState, undoRedoPlugin } from 'ng-simple-state';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgSimpleState({
      enableDevTool: isDevMode(),
      plugins: [undoRedoPlugin({ maxHistory: 50 })]
    })
  ]
});
```

The `undoRedoPlugin` is automatically registered as an injectable token (`NG_SIMPLE_STATE_UNDO_REDO`).  
Use `inject()` and `forStore()`:

```ts
import { Component, inject, Signal } from '@angular/core';
import { NG_SIMPLE_STATE_UNDO_REDO, NgSimpleStateUndoRedoPlugin } from 'ng-simple-state';
import { CounterState, CounterStore } from './counter-store';

@Component({
  selector: 'app-counter',
  template: `
    <h1>Counter: {{ counter() }}</h1>
    <button (click)="store.increment()">+</button>
    <button (click)="store.decrement()">-</button>
    <hr>
    <button [disabled]="!canUndo()" (click)="history.undo()">Undo</button>
    <button [disabled]="!canRedo()" (click)="history.redo()">Redo</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterComponent {
  store = inject(CounterStore);
  counter = this.store.selectCount();

  // Inject via token and bind to the store, no store name strings needed
  private readonly undoRedo = inject(NG_SIMPLE_STATE_UNDO_REDO) as NgSimpleStateUndoRedoPlugin<CounterState>;
  private readonly history = this.undoRedo.forStore(this.store);

  // Reactive signals (work with OnPush / zoneless)
  canUndo: Signal<boolean> = this.history.selectCanUndo();
  canRedo: Signal<boolean> = this.history.selectCanRedo();
}
```

`forStore(store)` returns a `NgSimpleStateUndoRedoForStore<S>` helper bound to the store.  
`undo()` and `redo()` call `replaceState` automatically, no manual wiring needed.

#### undoRedoPlugin API

```ts
const history = undoRedo.forStore(store);

// Reactive signals (Signal<boolean>)
history.selectCanUndo();
history.selectCanRedo();

// Undo/Redo, applies state automatically, returns true if successful
history.undo();
history.redo();

// Plain boolean checks
history.canUndo();
history.canRedo();

// Clear history
history.clearHistory();
```

#### Create Custom Plugin

You can create your own plugins implementing the `NgSimpleStatePlugin` interface:

```ts
import { NgSimpleStatePlugin, NgSimpleStatePluginContext } from 'ng-simple-state';

const myCustomPlugin: NgSimpleStatePlugin = {
  name: 'myPlugin',
  
  onBeforeStateChange(context: NgSimpleStatePluginContext): boolean | void {
    // Return false to prevent state change
    console.log(`Before: ${context.actionName}`);
  },
  
  onAfterStateChange(context: NgSimpleStatePluginContext): void {
    console.log(`After: ${context.actionName}`, context.nextState);
  },
  
  onStoreInit(storeName: string, initialState: unknown): void {
    console.log(`Store ${storeName} initialized`);
  },
  
  onStoreDestroy(storeName: string): void {
    console.log(`Store ${storeName} destroyed`);
  }
};
```

### Batch Updates

Group multiple state updates into a single emission to improve performance:

```ts
import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig, batchState } from 'ng-simple-state';

export interface FormState {
  name: string;
  email: string;
  phone: string;
  isValid: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormStore extends NgSimpleStateBaseSignalStore<FormState> {

  storeConfig(): NgSimpleStateStoreConfig<FormState> {
    return { storeName: 'FormStore' };
  }

  initialState(): FormState {
    return { name: '', email: '', phone: '', isValid: false };
  }

  selectForm(): Signal<FormState> {
    return this.selectState();
  }

  // Batch multiple updates - only one emission at the end
  updateAllFields(name: string, email: string, phone: string): void {
    batchState(() => {
      this.setState({ name });
      this.setState({ email });
      this.setState({ phone });
      this.setState({ isValid: this.validateForm(name, email, phone) });
    }); // Single emission with all changes
  }

  // Regular updates (each triggers an emission)
  setName(name: string): void {
    this.setState({ name });
  }

  setEmail(email: string): void {
    this.setState({ email });
  }

  private validateForm(name: string, email: string, phone: string): boolean {
    return name.length > 0 && email.includes('@') && phone.length >= 10;
  }
}
```

Usage in component:

```ts
@Component({
  selector: 'app-form',
  template: `
    <form (ngSubmit)="submitForm()">
      <input [(ngModel)]="name" name="name" placeholder="Name" />
      <input [(ngModel)]="email" name="email" placeholder="Email" />
      <input [(ngModel)]="phone" name="phone" placeholder="Phone" />
      <button type="submit">Save All (Batched)</button>
    </form>
    <p>Form Valid: {{ form().isValid ? 'Yes' : 'No' }}</p>
  `
})
export class FormComponent {
  store = inject(FormStore);
  form = this.store.selectForm();
  
  name = '';
  email = '';
  phone = '';

  submitForm(): void {
    // All updates batched into single emission
    this.store.updateAllFields(this.name, this.email, this.phone);
  }
}
```

### Immer-style Updates

Write mutable-looking code that produces immutable updates. First, install Immer and configure it:

```bash
npm install immer
```

```ts
// In your app bootstrap
import { produce } from 'immer';

provideNgSimpleState({
  immerProduce: produce
});
```

Store example with Immer:

```ts
import { Injectable, Signal } from '@angular/core';
import { NgSimpleStateBaseSignalStore, NgSimpleStateStoreConfig } from 'ng-simple-state';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UsersState {
  users: User[];
  selectedId: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsersStore extends NgSimpleStateBaseSignalStore<UsersState> {

  storeConfig(): NgSimpleStateStoreConfig<UsersState> {
    return { storeName: 'UsersStore' };
  }

  initialState(): UsersState {
    return { users: [], selectedId: null };
  }

  // Selectors
  selectUsers(): Signal<User[]> {
    return this.selectState(state => state.users);
  }

  selectSelectedUser(): Signal<User | undefined> {
    return this.selectState(state => 
      state.users.find(u => u.id === state.selectedId)
    );
  }

  // Actions using Immer produce - looks mutable but is immutable!
  addUser(user: User): void {
    this.produce(draft => {
      draft.users.push(user); // Looks mutable, but creates immutable update
    });
  }

  updateUserName(id: number, newName: string): void {
    this.produce(draft => {
      const user = draft.users.find(u => u.id === id);
      if (user) {
        user.name = newName; // Direct mutation syntax, but immutable result
      }
    });
  }

  removeUser(id: number): void {
    this.produce(draft => {
      const index = draft.users.findIndex(u => u.id === id);
      if (index !== -1) {
        draft.users.splice(index, 1); // Array mutation syntax
      }
    });
  }

  selectUser(id: number): void {
    this.setState({ selectedId: id });
  }
}
```

Usage in component:

```ts
@Component({
  selector: 'app-users',
  template: `
    <ul>
      @for (user of users(); track user.id) {
        <li [class.selected]="user.id === selectedUser()?.id">
          {{ user.name }} ({{ user.email }})
          <button (click)="store.selectUser(user.id)">Select</button>
          <button (click)="store.removeUser(user.id)">Remove</button>
        </li>
      }
    </ul>
    <button (click)="addNewUser()">Add User</button>
  `
})
export class UsersComponent {
  store = inject(UsersStore);
  users = this.store.selectUsers();
  selectedUser = this.store.selectSelectedUser();

  addNewUser(): void {
    this.store.addUser({
      id: Date.now(),
      name: 'New User',
      email: 'new@example.com'
    });
  }
}
```

### Redux DevTools Integration

Full integration with Redux DevTools browser extension for time-travel debugging:

```ts
// Enable DevTools in your app configuration
provideNgSimpleState({
  enableDevTool: isDevMode()
});
```

Features available in Redux DevTools:
- **Time-travel debugging** - Jump to any previous state
- **Action history** - See all dispatched actions with timestamps
- **State inspection** - Explore state tree at any point
- **Diff visualization** - See what changed between states
- **Export/Import** - Save and restore state

![Redux DevTools](https://github.com/nigrosimone/ng-simple-state/blob/main/projects/ng-simple-state-demo/src/assets/dev-tool.gif?raw=true)

## Alternatives

Aren't you satisfied? there are some valid alternatives:

 - [@tinystate](https://www.npmjs.com/package/@tinystate/core)
 - [@ngxs](https://www.npmjs.com/package/@ngxs/store)
## Support

This is an open-source project. Star this [repository](https://github.com/nigrosimone/ng-simple-state), if you like it, or even [donate](https://www.paypal.com/paypalme/snwp). Thank you so much!

## My other libraries

I have published some other Angular libraries, take a look:

 - [NgHttpCaching: Cache for HTTP requests in Angular application](https://www.npmjs.com/package/ng-http-caching)
 - [NgGenericPipe: Generic pipe for Angular application for use a component method into component template.](https://www.npmjs.com/package/ng-generic-pipe)
 - [NgLet: Structural directive for sharing data as local variable into html component template](https://www.npmjs.com/package/ng-let)
 - [NgForTrackByProperty: Angular global trackBy property directive with strict type checking](https://www.npmjs.com/package/ng-for-track-by-property)
