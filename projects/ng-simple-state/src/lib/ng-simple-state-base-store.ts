import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, asyncScheduler } from "rxjs";
import { map, distinctUntilChanged, observeOn } from "rxjs/operators";
import { NgSimpleStateDevTool } from "./ng-simple-state-dev-tool";

@Injectable()
export abstract class NgSimpleStateBaseStore<S> {
    private _state$: BehaviorSubject<S>;

    /**
    * Return the observable state
    * @returns Observable of the state
    */
    public get state(): BehaviorSubject<S> {
        return this._state$;
    }

    constructor(private ngSimpleStateDevTool: NgSimpleStateDevTool) {
        const initialState = this.initialState();
        this.devToolSend(initialState, `${this.constructor.name}.initialState`);
        this._state$ = new BehaviorSubject<S>(Object.assign({}, initialState));
    }

    /**
    * Set into the store the initial state
    * @returns The state object
    */
    protected abstract initialState(): S;

    /**
     * Select a store state
     * @param selectFn State selector
     * @returns Observable of the selected state
     */
    selectState<K>(selectFn: (state: Readonly<S>) => K): Observable<K> {
        return this._state$.pipe(
            map(state => selectFn(state as Readonly<S>)),
            distinctUntilChanged(),
            observeOn(asyncScheduler)
        );
    }

    /**
    * Return the current store state (snapshot)
    * @returns The current state
    */
    getCurrentState(): S {
        return this._state$.value;
    }

    /**
    * Set a new state
    * @param selectFn State reducer
    */
    setState(stateFn: (currentState: Readonly<S>) => Partial<S>, actionName?: string): void {
        const currState = this.getCurrentState();
        const newState = stateFn(currState);
        this.devToolSend(newState, actionName);
        this._state$.next(Object.assign({}, currState, newState));
    }

    /**
    * Complete the state
    */
    completeState(): void {
        this._state$.complete();
    }

    /**
    * Send to dev tool a new state
    * @param newState new state
    * @param actionName The action name
    */
    private devToolSend(newState: Partial<S>, actionName?: string): boolean {
        if (!this.ngSimpleStateDevTool.isEnabled()) {
            return false;
        }
        if (!actionName) {
            // retrive the parent (of parent) method into the stack trace
            actionName = new Error().stack
                .split("\n")[3]
                .trim()
                .split(" ")[1];
        }
        return this.ngSimpleStateDevTool.send(actionName, newState);
    }
}
