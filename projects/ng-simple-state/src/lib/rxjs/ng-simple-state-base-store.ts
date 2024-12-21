import { Injectable, OnDestroy, Directive } from '@angular/core';
import { BehaviorSubject, Observable, asyncScheduler } from 'rxjs';
import { map, distinctUntilChanged, observeOn } from 'rxjs/operators';
import { NgSimpleStateBaseCommonStore } from '../ng-simple-state-common';
import { NgSimpleStateComparator, NgSimpleStateSelectState, NgSimpleStateSetState } from '../ng-simple-state-models';

@Injectable()
@Directive()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseRxjsStore<S extends object | Array<any>> extends NgSimpleStateBaseCommonStore<S> implements OnDestroy {

    protected stackPoint: number = 4;
    private readonly state$: BehaviorSubject<S>;
    private readonly stateObs: Observable<S>;

    /**
     * Return the observable of the state
     * @returns Observable of the state
     */
    public get state(): Observable<S> {
        return this.stateObs;
    }

    constructor() {
        super()
        this.state$ = new BehaviorSubject<S>(this.selectFn(this.firstState));
        this.stateObs = this.state$.asObservable();
    }

    /**
     * When you override this method, you have to call the `super.ngOnDestroy()` method in your `ngOnDestroy()` method.
     */
    override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.state$.complete();
    }

    /**
     * Select a store state
     * @param selectFn State selector (if not provided return full state)
     * @param comparator A function used to compare the previous and current state for equality. Defaults to a `===` check.
     * @returns Observable of the selected state
     */
    selectState<K>(selectFn?: NgSimpleStateSelectState<S, K>, comparator?: NgSimpleStateComparator<K>): Observable<K> {
        selectFn ??= this.selectFn.bind(this);
        return this.state$.pipe(
            map(state => selectFn(state as Readonly<S>)),
            distinctUntilChanged(comparator ?? this.comparator),
            observeOn(asyncScheduler)
        );
    }

    /**
     * Return the current store state (snapshot)
     * @returns The current state
     */
    getCurrentState(): Readonly<S> {
        return this.deepFreeze(this.state$.getValue());
    }

    /**
     * Set a new state
     * @param selectFn State reducer
     * @param actionName The action label into Redux DevTools (default is parent function name)
     * @returns True if the state is changed
     */
    setState(stateFn: NgSimpleStateSetState<S>, actionName?: string): boolean {
        const currState = this.getCurrentState();
        const state = this.patchState(currState, stateFn(currState), actionName);
        if (typeof state !== 'undefined') {
            this.state$.next(state);
            return true;
        }
        return false;
    }
}

@Injectable()
@Directive()
/**
 * @deprecated use NgSimpleStateBaseRxjsStore
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class NgSimpleStateBaseStore<S extends object | Array<any>> extends NgSimpleStateBaseRxjsStore<S> {
    constructor() {
        super();
        if (this.devMode) {
            console.warn('NgSimpleStateBaseStore is deprecated. Please use NgSimpleStateBaseRxjsStore')
        }
    }
}