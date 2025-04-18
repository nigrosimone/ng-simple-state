import { inject, Injectable, NgZone } from '@angular/core';

interface DevtoolsLocal {
    init: (state: object) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: <T>(action: string, state: Record<string, T>, options: any, instanceId: string) => void;
}
interface Devtools {
    connect(options: { name: string, instanceId: string }): DevtoolsLocal;
}

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__: Devtools;
        devToolsExtension: Devtools;
    }
}

const instanceId = `ng-simple-state-${Date.now()}-${Math.random()}`;

@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {

    private readonly globalDevtools: Devtools = window.__REDUX_DEVTOOLS_EXTENSION__ || window.devToolsExtension;
    private localDevTool!: DevtoolsLocal;
    private readonly baseState: Record<string, object> = {};

    constructor() {
        if (this.globalDevtools) {
            // The `connect` method adds `message` event listener since it communicates
            // with an extension through `window.postMessage` and message events.
            // We handle only 2 events; thus, we don't want to run many change detections
            // because the extension sends events that we don't have to handle.
            inject(NgZone).runOutsideAngular(() => {
                this.localDevTool = this.globalDevtools.connect({
                    name: 'NgSimpleState',
                    instanceId: instanceId
                });
                if (this.localDevTool) {
                    this.localDevTool.init(this.baseState);
                }
            });
        }
    }

    /**
     * Return true if dev tool is active
     * @returns True if dev tool is active
     */
    isActive(): boolean {
        return !!this.localDevTool;
    }

    /**
     * Send to dev tool a new state
     * @param storeName The store name
     * @param actionName The action name
     * @param state the state
     * @returns True if dev tool is enabled and action is send
     */
    send<T>(storeName: string, actionName: string, state: T): boolean {
        if (this.localDevTool) {
            this.localDevTool.send<T>(`${storeName}.${actionName}`, Object.assign(this.baseState, { [storeName]: state }), false, instanceId);
            return true;
        }
        return false;
    }
}
