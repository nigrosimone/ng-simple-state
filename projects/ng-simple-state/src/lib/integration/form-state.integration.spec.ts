/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Signal, WritableSignal, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgSimpleStateBaseSignalStore } from '../signal/ng-simple-state-base-store';
import { NgSimpleStateStoreConfig } from '../ng-simple-state-models';
import { provideNgSimpleState } from '../ng-simple-state-provider';

// --- Form State Models ---

interface FormField<T = unknown> {
    value: T;
    touched: boolean;
    dirty: boolean;
    valid: boolean;
    errors: string[];
}

interface UserFormState {
    name: FormField<string>;
    email: FormField<string>;
    age: FormField<number>;
    acceptTerms: FormField<boolean>;
    formSubmitting: boolean;
    formSubmitted: boolean;
}

// --- Form Store with validation ---

@Injectable()
class UserFormStore extends NgSimpleStateBaseSignalStore<UserFormState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'UserForm'
        };
    }

    initialState(): UserFormState {
        return {
            name: { value: '', touched: false, dirty: false, valid: false, errors: ['Name is required'] },
            email: { value: '', touched: false, dirty: false, valid: false, errors: ['Email is required'] },
            age: { value: 0, touched: false, dirty: false, valid: false, errors: ['Age must be positive'] },
            acceptTerms: { value: false, touched: false, dirty: false, valid: false, errors: ['Must accept terms'] },
            formSubmitting: false,
            formSubmitted: false
        };
    }

    // Selectors
    selectName(): Signal<FormField<string>> {
        return this.selectState(state => state.name);
    }

    selectEmail(): Signal<FormField<string>> {
        return this.selectState(state => state.email);
    }

    selectAge(): Signal<FormField<number>> {
        return this.selectState(state => state.age);
    }

    selectIsFormValid(): Signal<boolean> {
        return this.selectState(state => 
            state.name.valid && 
            state.email.valid && 
            state.age.valid && 
            state.acceptTerms.valid
        );
    }

    selectFormErrors(): Signal<string[]> {
        return this.selectState(state => [
            ...state.name.errors,
            ...state.email.errors,
            ...state.age.errors,
            ...state.acceptTerms.errors
        ]);
    }

    // Validators
    private validateName(value: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!value.trim()) {
            errors.push('Name is required');
        } else if (value.length < 2) {
            errors.push('Name must be at least 2 characters');
        } else if (value.length > 50) {
            errors.push('Name must be less than 50 characters');
        }
        return { valid: errors.length === 0, errors };
    }

    private validateEmail(value: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (!value.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push('Invalid email format');
        }
        return { valid: errors.length === 0, errors };
    }

    private validateAge(value: number): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (value <= 0) {
            errors.push('Age must be positive');
        } else if (value < 18) {
            errors.push('Must be at least 18 years old');
        } else if (value > 120) {
            errors.push('Invalid age');
        }
        return { valid: errors.length === 0, errors };
    }

    // Actions
    setName(value: string): boolean {
        const validation = this.validateName(value);
        return this.setState(state => ({
            name: { ...state.name, value, dirty: true, ...validation }
        }));
    }

    setEmail(value: string): boolean {
        const validation = this.validateEmail(value);
        return this.setState(state => ({
            email: { ...state.email, value, dirty: true, ...validation }
        }));
    }

    setAge(value: number): boolean {
        const validation = this.validateAge(value);
        return this.setState(state => ({
            age: { ...state.age, value, dirty: true, ...validation }
        }));
    }

    setAcceptTerms(value: boolean): boolean {
        return this.setState(state => ({
            acceptTerms: { 
                ...state.acceptTerms, 
                value, 
                dirty: true, 
                valid: value, 
                errors: value ? [] : ['Must accept terms'] 
            }
        }));
    }

    touchField(field: 'name' | 'email' | 'age' | 'acceptTerms'): boolean {
        return this.setState(state => ({
            [field]: { ...state[field], touched: true }
        }));
    }

    touchAllFields(): boolean {
        return this.setState(state => ({
            name: { ...state.name, touched: true },
            email: { ...state.email, touched: true },
            age: { ...state.age, touched: true },
            acceptTerms: { ...state.acceptTerms, touched: true }
        }));
    }

    setSubmitting(submitting: boolean): boolean {
        return this.setState({ formSubmitting: submitting });
    }

    setSubmitted(submitted: boolean): boolean {
        return this.setState({ formSubmitted: submitted });
    }

    resetForm(): boolean {
        return this.restartState();
    }
}

// --- Produce Method Test Store ---

interface TodoItem {
    id: number;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
}

interface TodoState {
    todos: TodoItem[];
    filter: 'all' | 'active' | 'completed';
    sortBy: 'id' | 'priority' | 'text';
}

@Injectable()
class TodoStore extends NgSimpleStateBaseSignalStore<TodoState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'TodoStore'
        };
    }

    initialState(): TodoState {
        return {
            todos: [],
            filter: 'all',
            sortBy: 'id'
        };
    }

    selectTodos(): Signal<TodoItem[]> {
        return this.selectState(state => state.todos);
    }

    selectFilteredTodos(): Signal<TodoItem[]> {
        return this.selectState(state => {
            switch (state.filter) {
                case 'active':
                    return state.todos.filter(t => !t.completed);
                case 'completed':
                    return state.todos.filter(t => t.completed);
                default:
                    return state.todos;
            }
        });
    }

    selectCompletedCount(): Signal<number> {
        return this.selectState(state => 
            state.todos.filter(t => t.completed).length
        );
    }

    selectActiveCount(): Signal<number> {
        return this.selectState(state => 
            state.todos.filter(t => !t.completed).length
        );
    }

    // Using produce for mutable-style updates
    addTodo(text: string, priority: 'low' | 'medium' | 'high' = 'medium'): boolean {
        return this.produce(draft => {
            const newId = draft.todos.length > 0 
                ? Math.max(...draft.todos.map(t => t.id)) + 1 
                : 1;
            draft.todos.push({
                id: newId,
                text,
                completed: false,
                priority,
                tags: []
            });
        }, 'addTodo');
    }

    toggleTodo(id: number): boolean {
        return this.produce(draft => {
            const todo = draft.todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
            }
        }, 'toggleTodo');
    }

    updateTodoText(id: number, text: string): boolean {
        return this.produce(draft => {
            const todo = draft.todos.find(t => t.id === id);
            if (todo) {
                todo.text = text;
            }
        }, 'updateTodoText');
    }

    addTagToTodo(id: number, tag: string): boolean {
        return this.produce(draft => {
            const todo = draft.todos.find(t => t.id === id);
            if (todo && !todo.tags.includes(tag)) {
                todo.tags.push(tag);
            }
        }, 'addTagToTodo');
    }

    removeTodo(id: number): boolean {
        return this.produce(draft => {
            const index = draft.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                draft.todos.splice(index, 1);
            }
        }, 'removeTodo');
    }

    setFilter(filter: 'all' | 'active' | 'completed'): boolean {
        return this.setState({ filter });
    }

    completeAll(): boolean {
        return this.produce(draft => {
            draft.todos.forEach(todo => {
                todo.completed = true;
            });
        }, 'completeAll');
    }

    clearCompleted(): boolean {
        return this.produce(draft => {
            draft.todos = draft.todos.filter(t => !t.completed);
        }, 'clearCompleted');
    }
}

// --- LinkedState Test Store ---

interface CounterWithHistoryState {
    current: number;
    min: number;
    max: number;
    history: number[];
}

@Injectable()
class CounterWithHistoryStore extends NgSimpleStateBaseSignalStore<CounterWithHistoryState> {

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'CounterWithHistory'
        };
    }

    initialState(): CounterWithHistoryState {
        return {
            current: 0,
            min: 0,
            max: 0,
            history: [0]
        };
    }

    // LinkedState for bidirectional updates
    linkedCounter(): WritableSignal<number> {
        return this.linkedState({
            source: state => state.current,
            computation: (value) => {
                return value;
            }
        });
    }

    selectCurrent(): Signal<number> {
        return this.selectState(state => state.current);
    }

    selectHistory(): Signal<number[]> {
        return this.selectState(state => state.history);
    }

    selectMinMax(): Signal<{ min: number; max: number }> {
        return this.selectState(state => ({ min: state.min, max: state.max }));
    }

    increment(by: number = 1): boolean {
        return this.setState(state => {
            const newValue = state.current + by;
            return {
                current: newValue,
                max: Math.max(state.max, newValue),
                min: Math.min(state.min, newValue),
                history: [...state.history, newValue]
            };
        });
    }

    decrement(by: number = 1): boolean {
        return this.setState(state => {
            const newValue = state.current - by;
            return {
                current: newValue,
                max: Math.max(state.max, newValue),
                min: Math.min(state.min, newValue),
                history: [...state.history, newValue]
            };
        });
    }

    setValue(value: number): boolean {
        return this.setState(state => ({
            current: value,
            max: Math.max(state.max, value),
            min: Math.min(state.min, value),
            history: [...state.history, value]
        }));
    }
}

// --- Effects Test Store ---

interface NotificationState {
    notifications: Array<{ id: number; message: string; type: 'info' | 'success' | 'error' }>;
    lastId: number;
}

@Injectable()
class NotificationStore extends NgSimpleStateBaseSignalStore<NotificationState> {
    
    public effectLog: string[] = [];
    public cleanupCalled = 0;

    storeConfig(): NgSimpleStateStoreConfig {
        return {
            storeName: 'Notifications'
        };
    }

    initialState(): NotificationState {
        return {
            notifications: [],
            lastId: 0
        };
    }

    selectNotifications(): Signal<NotificationState['notifications']> {
        return this.selectState(state => state.notifications);
    }

    selectCount(): Signal<number> {
        return this.selectState(state => state.notifications.length);
    }

    addNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): boolean {
        return this.setState(state => ({
            lastId: state.lastId + 1,
            notifications: [...state.notifications, { id: state.lastId + 1, message, type }]
        }));
    }

    removeNotification(id: number): boolean {
        return this.setState(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
        }));
    }

    clearAll(): boolean {
        return this.setState({ notifications: [] });
    }

    setupTestEffect(): void {
        this.createEffect('testLogger', (state) => {
            this.effectLog.push(`notifications: ${state.notifications.length}`);
            
            return () => {
                this.cleanupCalled++;
            };
        });
    }

    setupSelectorEffect(): void {
        this.createSelectorEffect(
            'countEffect',
            state => state.notifications.length,
            (count) => {
                this.effectLog.push(`count changed: ${count}`);
            }
        );
    }
}

// --- Integration Tests ---

describe('Form State Management Integration Tests', () => {

    let formStore: UserFormStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                UserFormStore
            ]
        });
        formStore = TestBed.inject(UserFormStore);
    });

    describe('Field Validation', () => {

        it('should validate name field correctly', () => {
            // Empty name is invalid
            expect(formStore.selectName()().valid).toBeFalse();
            expect(formStore.selectName()().errors).toContain('Name is required');

            // Short name is invalid
            formStore.setName('A');
            expect(formStore.selectName()().valid).toBeFalse();
            expect(formStore.selectName()().errors).toContain('Name must be at least 2 characters');

            // Valid name
            formStore.setName('John Doe');
            expect(formStore.selectName()().valid).toBeTrue();
            expect(formStore.selectName()().errors.length).toBe(0);
        });

        it('should validate email field correctly', () => {
            // Empty email is invalid
            expect(formStore.selectEmail()().valid).toBeFalse();

            // Invalid format
            formStore.setEmail('invalid-email');
            expect(formStore.selectEmail()().valid).toBeFalse();
            expect(formStore.selectEmail()().errors).toContain('Invalid email format');

            // Valid email
            formStore.setEmail('john@example.com');
            expect(formStore.selectEmail()().valid).toBeTrue();
        });

        it('should validate age field correctly', () => {
            // Zero is invalid
            expect(formStore.selectAge()().valid).toBeFalse();

            // Under 18 is invalid
            formStore.setAge(15);
            expect(formStore.selectAge()().valid).toBeFalse();
            expect(formStore.selectAge()().errors).toContain('Must be at least 18 years old');

            // Valid age
            formStore.setAge(25);
            expect(formStore.selectAge()().valid).toBeTrue();
        });

        it('should track dirty state', () => {
            expect(formStore.selectName()().dirty).toBeFalse();
            
            formStore.setName('Test');
            
            expect(formStore.selectName()().dirty).toBeTrue();
        });

        it('should track touched state', () => {
            expect(formStore.selectName()().touched).toBeFalse();
            
            formStore.touchField('name');
            
            expect(formStore.selectName()().touched).toBeTrue();
        });

        it('should touch all fields', () => {
            formStore.touchAllFields();
            
            const state = formStore.getCurrentState();
            expect(state.name.touched).toBeTrue();
            expect(state.email.touched).toBeTrue();
            expect(state.age.touched).toBeTrue();
            expect(state.acceptTerms.touched).toBeTrue();
        });
    });

    describe('Form Validity', () => {

        it('should be invalid initially', () => {
            expect(formStore.selectIsFormValid()()).toBeFalse();
        });

        it('should be valid when all fields are valid', () => {
            formStore.setName('John Doe');
            formStore.setEmail('john@example.com');
            formStore.setAge(25);
            formStore.setAcceptTerms(true);
            
            expect(formStore.selectIsFormValid()()).toBeTrue();
        });

        it('should collect all form errors', () => {
            const errors = formStore.selectFormErrors()();
            
            expect(errors.length).toBeGreaterThan(0);
            expect(errors).toContain('Name is required');
            expect(errors).toContain('Email is required');
        });

        it('should have no errors when form is valid', () => {
            formStore.setName('John Doe');
            formStore.setEmail('john@example.com');
            formStore.setAge(25);
            formStore.setAcceptTerms(true);
            
            expect(formStore.selectFormErrors()().length).toBe(0);
        });
    });

    describe('Form Submission Flow', () => {

        it('should handle complete submission flow', () => {
            // Fill form
            formStore.setName('Jane Doe');
            formStore.setEmail('jane@example.com');
            formStore.setAge(30);
            formStore.setAcceptTerms(true);
            
            // Verify valid
            expect(formStore.selectIsFormValid()()).toBeTrue();
            
            // Start submission
            formStore.setSubmitting(true);
            expect(formStore.getCurrentState().formSubmitting).toBeTrue();
            
            // Complete submission
            formStore.setSubmitting(false);
            formStore.setSubmitted(true);
            
            expect(formStore.getCurrentState().formSubmitting).toBeFalse();
            expect(formStore.getCurrentState().formSubmitted).toBeTrue();
        });

        it('should reset form to initial state', () => {
            formStore.setName('John');
            formStore.setEmail('john@test.com');
            formStore.touchAllFields();
            
            formStore.resetForm();
            
            const state = formStore.getCurrentState();
            expect(state.name.value).toBe('');
            expect(state.name.touched).toBeFalse();
            expect(state.name.dirty).toBeFalse();
        });
    });
});

describe('Produce Method Integration Tests', () => {

    let todoStore: TodoStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                TodoStore
            ]
        });
        todoStore = TestBed.inject(TodoStore);
    });

    it('should add todos using produce', () => {
        todoStore.addTodo('Buy groceries');
        todoStore.addTodo('Walk the dog', 'high');
        todoStore.addTodo('Read a book', 'low');
        
        expect(todoStore.selectTodos()().length).toBe(3);
        expect(todoStore.selectTodos()()[0].text).toBe('Buy groceries');
        expect(todoStore.selectTodos()()[1].priority).toBe('high');
    });

    it('should toggle todo completion using produce', () => {
        todoStore.addTodo('Test task');
        
        expect(todoStore.selectCompletedCount()()).toBe(0);
        
        todoStore.toggleTodo(1);
        
        expect(todoStore.selectCompletedCount()()).toBe(1);
        expect(todoStore.selectTodos()()[0].completed).toBeTrue();
    });

    it('should update todo text using produce', () => {
        todoStore.addTodo('Original text');
        
        todoStore.updateTodoText(1, 'Updated text');
        
        expect(todoStore.selectTodos()()[0].text).toBe('Updated text');
    });

    it('should add tags to todo using produce', () => {
        todoStore.addTodo('Tagged task');
        
        todoStore.addTagToTodo(1, 'urgent');
        todoStore.addTagToTodo(1, 'work');
        todoStore.addTagToTodo(1, 'urgent'); // Duplicate, should not be added
        
        const todo = todoStore.selectTodos()()[0];
        expect(todo.tags).toEqual(['urgent', 'work']);
    });

    it('should remove todo using produce', () => {
        todoStore.addTodo('Task 1');
        todoStore.addTodo('Task 2');
        todoStore.addTodo('Task 3');
        
        todoStore.removeTodo(2);
        
        expect(todoStore.selectTodos()().length).toBe(2);
        expect(todoStore.selectTodos()().map(t => t.text)).toEqual(['Task 1', 'Task 3']);
    });

    it('should filter todos', () => {
        todoStore.addTodo('Active 1');
        todoStore.addTodo('Active 2');
        todoStore.addTodo('Completed 1');
        todoStore.toggleTodo(3);
        
        // All
        expect(todoStore.selectFilteredTodos()().length).toBe(3);
        
        // Active
        todoStore.setFilter('active');
        expect(todoStore.selectFilteredTodos()().length).toBe(2);
        
        // Completed
        todoStore.setFilter('completed');
        expect(todoStore.selectFilteredTodos()().length).toBe(1);
    });

    it('should complete all todos using produce', () => {
        todoStore.addTodo('Task 1');
        todoStore.addTodo('Task 2');
        todoStore.addTodo('Task 3');
        
        todoStore.completeAll();
        
        expect(todoStore.selectActiveCount()()).toBe(0);
        expect(todoStore.selectCompletedCount()()).toBe(3);
    });

    it('should clear completed todos using produce', () => {
        todoStore.addTodo('Keep 1');
        todoStore.addTodo('Remove 1');
        todoStore.addTodo('Keep 2');
        todoStore.toggleTodo(2); // Mark for removal
        
        todoStore.clearCompleted();
        
        expect(todoStore.selectTodos()().length).toBe(2);
        expect(todoStore.selectTodos()().map(t => t.text)).toEqual(['Keep 1', 'Keep 2']);
    });
});

describe('LinkedState Integration Tests', () => {

    let counterStore: CounterWithHistoryStore;
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                CounterWithHistoryStore
            ]
        });
        counterStore = TestBed.inject(CounterWithHistoryStore);
        injector = TestBed.inject(Injector);
    });

    it('should track counter with history', () => {
        counterStore.increment(5);
        counterStore.increment(3);
        counterStore.decrement(2);
        
        expect(counterStore.selectCurrent()()).toBe(6);
        expect(counterStore.selectHistory()()).toEqual([0, 5, 8, 6]);
    });

    it('should track min and max values', () => {
        counterStore.increment(10);
        counterStore.decrement(15); // -5
        counterStore.increment(20); // 15
        
        const minMax = counterStore.selectMinMax()();
        expect(minMax.min).toBe(-5);
        expect(minMax.max).toBe(15);
    });

    it('should create linked signal from state', () => {
        runInInjectionContext(injector, () => {
            const linked = counterStore.linkedCounter();
            
            expect(linked()).toBe(0);
            
            counterStore.increment(5);
            
            // Linked signal should reflect state change
            expect(linked()).toBe(5);
        });
    });

    it('should set value directly', () => {
        counterStore.setValue(42);
        
        expect(counterStore.selectCurrent()()).toBe(42);
        expect(counterStore.selectHistory()()).toEqual([0, 42]);
    });
});

describe('Effects Integration Tests', () => {

    let notificationStore: NotificationStore;
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideNgSimpleState({ enableDevTool: false }),
                NotificationStore
            ]
        });
        notificationStore = TestBed.inject(NotificationStore);
        injector = TestBed.inject(Injector);
    });

    afterEach(() => {
        notificationStore.ngOnDestroy();
    });

    it('should add and remove notifications', () => {
        notificationStore.addNotification('Hello', 'info');
        notificationStore.addNotification('Success!', 'success');
        notificationStore.addNotification('Error!', 'error');
        
        expect(notificationStore.selectCount()()).toBe(3);
        
        notificationStore.removeNotification(2);
        
        expect(notificationStore.selectCount()()).toBe(2);
    });

    it('should clear all notifications', () => {
        notificationStore.addNotification('One');
        notificationStore.addNotification('Two');
        
        notificationStore.clearAll();
        
        expect(notificationStore.selectCount()()).toBe(0);
    });

    it('should register and destroy effects', () => {
        runInInjectionContext(injector, () => {
            notificationStore.setupTestEffect();
            
            const effectNames = notificationStore.getEffectNames();
            expect(effectNames).toContain('testLogger');
            
            notificationStore.destroyEffect('testLogger');
            
            expect(notificationStore.getEffectNames()).not.toContain('testLogger');
        });
    });

    it('should register selector effects', () => {
        runInInjectionContext(injector, () => {
            notificationStore.setupSelectorEffect();
            
            expect(notificationStore.getEffectNames()).toContain('countEffect');
        });
    });

    it('should destroy all effects on store destroy', () => {
        runInInjectionContext(injector, () => {
            notificationStore.setupTestEffect();
            notificationStore.setupSelectorEffect();
            
            expect(notificationStore.getEffectNames().length).toBe(2);
            
            notificationStore.ngOnDestroy();
            
            expect(notificationStore.getEffectNames().length).toBe(0);
        });
    });
});
