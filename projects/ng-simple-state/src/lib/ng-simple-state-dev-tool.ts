import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {

    // tslint:disable-next-line: no-string-literal
    private globalDevtools: any = (window as any)['__REDUX_DEVTOOLS_EXTENSION__'] || (window as any)['devToolsExtension'];
    private localDevTool: any;
    private isActiveDevtool = false;
    private instanceId = `ng-simple-state-${Date.now()}`;
    private baseState: { [key: string]: any } = {};

    constructor(ngZone: NgZone) {
        if (this.globalDevtools) {
            // The `connect` method adds `message` event listener since it communicates
            // with an extension through `window.postMessage` and message events.
            // We handle only 2 events; thus, we don't want to run many change detections
            // because the extension sends events that we don't have to handle.
            ngZone.runOutsideAngular(() => {
                this.localDevTool = this.globalDevtools.connect({
                    name: 'NgSimpleState',
                    instanceId: this.instanceId
                });
                this.isActiveDevtool = !!this.localDevTool;
                if (this.isActiveDevtool) {
                    this.localDevTool.init(this.baseState);
                }
            });
        }
    }

    /**
     * Return true if dev tool is actvice
     * @returns True if dev tool is actvice
     */
    isActive(): boolean {
        return this.isActiveDevtool;
    }

    /**
     * Send to dev tool a new state
     * @param storeName The store name
     * @param actionName The action name
     * @param state the state
     * @returns True if dev tool is enabled and action is send
     */
    send(storeName: string, actionName: string, state: any): boolean {
        if (this.isActiveDevtool) {
            this.localDevTool.send(`${storeName}.${actionName}`, Object.assign(this.baseState, { [storeName]: state }), false, this.instanceId);
            return true;
        }
        return false;
    }
}
