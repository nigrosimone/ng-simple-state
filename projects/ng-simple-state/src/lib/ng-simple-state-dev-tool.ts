import { Inject, Injectable, Optional } from "@angular/core";
import { NgSimpleStateConfig, NG_SIMPLE_STORE_CONFIG } from "./ng-simple-state-models";


@Injectable({ providedIn: 'root' })
export class NgSimpleStateDevTool {

    private globalDevtools: any = window["__REDUX_DEVTOOLS_EXTENSION__"] || window["devToolsExtension"];
    private localDevTool: any;

    constructor(@Inject(NG_SIMPLE_STORE_CONFIG) @Optional() private config?: NgSimpleStateConfig) {
        if (this.config && this.config.enableDevTool && this.globalDevtools) {
            this.localDevTool = this.globalDevtools.connect({
                name: 'NgSimpleState'
            });
        }
    }


    /**
     * Return true if dev tool are enabled
     */    
    isEnabled(): boolean {
        return !!this.localDevTool;
    }

    /**
     * Send a new state to dev tool
     */
    send(name: string, state: any): boolean {
        if (this.localDevTool) {
            this.localDevTool.send(name, state);
            return true;
        }
        return false;
    }
}
