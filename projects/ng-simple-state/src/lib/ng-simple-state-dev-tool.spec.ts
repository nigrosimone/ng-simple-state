import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';

export class DevToolsExtension {
    name = null;
    state = null;

    connect(): any {
        const self = this;
        return {
            send: (name: string, state: any) => {
                self.name = name;
                self.state = state;
            }
        };
    }
}

describe('NgSimpleStateDevTool', () => {

    it('enableDevTool active', () => {
        window['devToolsExtension'] = new DevToolsExtension();
        const service = new NgSimpleStateDevTool();
        expect(service.isActive()).toBe(true);
        expect(service.send('test', 'test1', 'test2')).toBe(true);
        expect(window['devToolsExtension'].name).toBe('test.test1');
        expect(window['devToolsExtension'].state).toEqual({ test: 'test2' });
    });

    it('no devToolsExtension', () => {
        window['devToolsExtension'] = null;
        const service = new NgSimpleStateDevTool();
        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect(window['devToolsExtension']).toBe(null);
    });

    it('no localDevTool', () => {
        window['devToolsExtension'] = {
            name: null,
            state: null,
            connect(): any {
                return null;
            }
        };
        const service = new NgSimpleStateDevTool();
        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect(window['devToolsExtension'].name).toBe(null);
        expect(window['devToolsExtension'].state).toBe(null);
    });
});
