import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {

    private globalDevtools: any = window["__REDUX_DEVTOOLS_EXTENSION__"] || window["devToolsExtension"];
    private localDevTool: any;
    private _isActive: boolean = false;

    constructor() {
        if (this.globalDevtools) {
            this.localDevTool = this.globalDevtools.connect({
                name: 'NgSimpleState'
            });
            this._isActive = !!this.localDevTool;
        }
    }

    /**
     * Return true if dev tool is actvice
     * @returns True if dev tool is actvice
     */
    isActive(): boolean {
        return this._isActive;
    }

    /**
    * Send to dev tool a new state
    * @param newState new state
    * @param actionName The action name
    * @returns True if dev tool is enabled
    */
    send(name: string, state: any): boolean {
        if (this._isActive) {
            this.localDevTool.send(name, state);
            return true;
        }
        return false;
    }
}
