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

| Option               | Description                                                                                     | Default          |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| *enableDevTool*      | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`          |
| *persistentStorage*  | Set the persistent storage `local` or `session`.                                                | undefined        |
| *comparator*         | A function used to compare the previous and current state for equality.                         | `a === b`        |
| *serializeState*     | A function used to serialize the state to a string.                                             | `JSON.stringify` |
| *deserializeState*   | A function used to deserialize the state from a string.                                         | `JSON.parse`     |

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
}
```

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
