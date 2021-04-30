import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, asyncScheduler } from "rxjs";
import { map, distinctUntilChanged, observeOn } from "rxjs/operators";
import { NgSimpleStateDevTool } from "./ng-simple-state-dev-tool";


@Injectable()
export abstract class NgSimpleStateBaseStore<S> {
    private _state$: BehaviorSubject<S> = new BehaviorSubject<S>(
        Object.assign({}, this.initialState())
    );

    /**
    * Return the observable state
    */
    public get state(): BehaviorSubject<S> {
        return this._state$;
    }

    constructor(private ngSimpleStateDevTool: NgSimpleStateDevTool) { }

    /**
    * Set the store initial state
    */
    protected abstract initialState(): S;

    /**
    * Select a store state
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
    */
    getCurrentState(): S {
        return this._state$.value;
    }

    /**
    * Set a new state
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
