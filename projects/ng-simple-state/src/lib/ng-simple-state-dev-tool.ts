import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {

    // tslint:disable-next-line: no-string-literal
    private globalDevtools: any = window['__REDUX_DEVTOOLS_EXTENSION__'] || window['devToolsExtension'];
    private localDevTool: any;
    private isActiveDevtool = false;

    constructor() {
        if (this.globalDevtools) {
            this.localDevTool = this.globalDevtools.connect({
                name: 'NgSimpleState'
            });
            this.isActiveDevtool = !!this.localDevTool;
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
     * @param newState new state
     * @param actionName The action name
     * @returns True if dev tool is enabled
     */
    send(name: string, state: any): boolean {
        if (this.isActiveDevtool) {
            this.localDevTool.send(name, state);
            return true;
        }
        return false;
    }
}
