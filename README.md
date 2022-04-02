# NgSimpleState [![Build Status](https://app.travis-ci.com/nigrosimone/ng-simple-state.svg?branch=main)](https://app.travis-ci.com/nigrosimone/ng-simple-state) [![Coverage Status](https://coveralls.io/repos/github/nigrosimone/ng-simple-state/badge.svg?branch=main)](https://coveralls.io/github/nigrosimone/ng-simple-state?branch=main) [![NPM version](https://img.shields.io/npm/v/ng-simple-state.svg)](https://www.npmjs.com/package/ng-simple-state) [![Maintainability](https://api.codeclimate.com/v1/badges/1bfc363a95053ecc3429/maintainability)](https://codeclimate.com/github/nigrosimone/ng-simple-state/maintainability)

Simple state management in Angular with only Services and RxJS.

## Description

Sharing state between components as simple as possible and leverage the good parts of component state and Angular's dependency injection system.

See the [stackblitz demo](https://stackblitz.com/edit/demo-ng-simple-state?file=src%2Fapp%2Fapp.component.ts).

## Get Started

### Step 1: install `ng-simple-state`

```bash
npm i ng-simple-state
```

### Step 2: Import `NgSimpleStateModule` into your `AppModule`

`NgSimpleStateModule` has some global optional config defined by `NgSimpleStateConfig` interface:

| Option               | Description                                                                                     | Default    |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| *enableDevTool*      | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`    |
| *enableLocalStorage* | if `true` latest state of store is saved in local storage and reloaded on store initialization. | `false`    |
| *persistentStorage*  | Set the persistent storage `local` or `session`                                                 | `local`    |

_Side note: each store can be override the global configuration implementing `storeConfig()` method (see "Override global config")._

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'ng-simple-state';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production, // Enable Redux DevTools only in development mode
      enableLocalStorage: false // Local storage state persistence is globally disabled
    }) 
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Step 3: Create your store

This is an example for a counter store in a `src/app/counter-store.ts` file. 
Obviously, you can create every store you want with every complexity you need.

1) Define yuor state interface, eg.:

```ts
export interface CounterState {
    count: number;
}
```

2) Define your store service by extending `NgSimpleStateBaseStore`, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseStore } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
 
}
```

3) Implement `initialState()` method and provide the initial state of the store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseStore } from 'ng-simple-state';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
  
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
import { NgSimpleStateBaseStore } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
    count: number;
}
 
@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {
  
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
import { NgSimpleStateBaseStore } from 'ng-simple-state';
import { Observable } from 'rxjs';

export interface CounterState {
  count: number;
}

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

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

### Step 3: Inject your store into the providers of the module you want (or the providers of component), eg.:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { NgSimpleStateModule } from 'ng-simple-state';
import { environment } from '../environments/environment';
import { CounterStore } from './counter-store';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    NgSimpleStateModule.forRoot({
      enableDevTool: !environment.production, // Enable Redux DevTools only in developing
      enableLocalStorage: false // Local storage state persistence is globally disabled
    })
  ],
  bootstrap: [AppComponent],
  providers: [CounterStore]  // The CounterStore state is shared at AppModule level
})
export class AppModule {}
```

### Step 4: Use your store into the components, eg.:

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-root',
  template: `
  <h1>Counter: {{ counter$ | async }}</h1>
  <button (click)="counterStore.decrement()">Decrement</button>
  <button (click)="counterStore.resetState()">Reset</button>
  <button (click)="counterStore.increment()">Increment</button>
  `,
})
export class AppComponent {
  public counter$: Observable<number>;

  constructor(public counterStore: CounterStore) {
    this.counter$ = this.counterStore.selectCount();
  }
}
```

### That's all!

![alt text](https://github.com/nigrosimone/ng-simple-state/blob/main/projects/ng-simple-state-demo/src/assets/dev-tool.gif?raw=true)

## Store's dependency injection

If you need to inject something into your store (eg. `HttpClient`), you need to also inject the Angular `Injector` service to the super, eg.:

```ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgSimpleStateBaseStore } from 'ng-simple-state';

@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  constructor(injector: Injector, private http: HttpClient) {
    super(injector);
  }

  increment(increment: number = 1): void {
    this.http.post<CounterState>('https://localhost:300/api/increment', { increment }).subscribe(response => {
      // setState() from default use parent function name as action name for Redux DevTools.
      // In this case we provide a second parameter `actionName` because the parent function is anonymous function
      this.setState(() => ({ count: response.count }), 'increment');
    });
  }

}
```

## Override global config

If you need to override the global module configuration provided by `NgSimpleStateModule.forRoot()` you can implement `storeConfig()` and return a specific configuration for the single store, eg.:

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateStoreConfig } from 'ng-simple-state';


@Injectable()
export class CounterStore extends NgSimpleStateBaseStore<CounterState> {

  override storeConfig(): NgSimpleStateStoreConfig {
    return {
      enableLocalStorage: true, // enable local storage for this store
      persistentStorage: 'session', // persistentStorage can be 'session' or 'local' (default is localStorage)
      storeName: 'CounterStore2', // For default the store name is the class name, you can set a specific name for this store (must be be unique)
    }
  }
}
```

The options are defined by `NgSimpleStateStoreConfig` interface:

| Option               | Description                                                                                     | Default    |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| *enableDevTool*      | if `true` enable `Redux DevTools` browser extension for inspect the state of the store.         | `false`    |
| *enableLocalStorage* | if `true` latest state of store is saved in local storage and reloaded on store initialization. | `false`    |
| *storeName*          | The name used into `Redux DevTools` and local storage key.                                      | Class name |
| *persistentStorage*  | Set the persistent storage `local` or `session`                                                 | `local`    |


## Testing

`ng-simple-state` is simple to test. Eg.:

```ts
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateModule } from 'ng-simple-state';
import { CounterStore } from './counter-store';

describe('CounterStore', () => {

  let counterStore: CounterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgSimpleStateModule.forRoot({
          enableDevTool: false,
          enableLocalStorage: false
        })
      ]
    });

    counterStore = new CounterStore(TestBed);
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

## Example: array store

This is an example for a todo list store in a `src/app/todo-store.ts` file. 

```ts
import { Injectable } from '@angular/core';
import { NgSimpleStateBaseStore } from 'ng-simple-state';
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
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo, TodoStore } from './todo-store';

@Component({
  selector: 'app-root',
  template: `
    <input #newTodo> <button (click)="todoStore.add({name: newTodo.value, completed: false})">Add todo</button>
    <ol>
        <li *ngFor="let todo of todoList$ | async">
            <ng-container *ngIf="todo.completed">✅</ng-container> 
            {{ todo.name }} 
            <button (click)="todoStore.setComplete(todo.id, !todo.completed)">Mark as {{ todo.completed ? 'Not completed' : 'Completed' }}</button> 
            <button (click)="todoStore.delete(todo.id)">Delete</button>
        </li>
    </ol>
  `,
  providers: [TodoStore]
})
export class AppComponent {
  public todoList$: Observable<Todo[]>;

  constructor(public todoStore: TodoStore) {
    this.todoList$ = this.todoStore.selectState();
  }
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

 - [NgSimpleState: Simple state management in Angular with only Services and RxJS](https://www.npmjs.com/package/ng-simple-state)
 - [NgPortal: Component property connection in Angular application](https://www.npmjs.com/package/ng-portal)
 - [NgHttpCaching: Cache for HTTP requests in Angular application](https://www.npmjs.com/package/ng-http-caching)
 - [NgGenericPipe: Generic pipe for Angular application](https://www.npmjs.com/package/ng-generic-pipe)
 - [NgLet: Structural directive for sharing data as local variable into html component template](https://www.npmjs.com/package/ng-simple-state)
 - [NgLock: Angular decorator for lock a function and user interface while a task running](https://www.npmjs.com/package/ng-lock)
 - [NgCondition: An alternative to `*ngIf; else` directive for simplify conditions into HTML template for Angular application](https://www.npmjs.com/package/ng-condition)
