import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';

export class DevToolsExtension {
    name = null;
    state = null;

    connect() {
        const self = this;
        return {
            send: (name: string, state: any) => {
                self.name = name;
                self.state = state;
            }
        }
    }
};

describe('NgSimpleStateDevTool', () => {

    it('enableDevTool active', () => {
        window["devToolsExtension"] = new DevToolsExtension();
        const _service = new NgSimpleStateDevTool();
        expect(_service.isActive()).toBe(true);
        expect(_service.send('test1', 'test2')).toBe(true);
        expect(window["devToolsExtension"].name).toBe('test1');
        expect(window["devToolsExtension"].state).toBe('test2');
    });

    it('no devToolsExtension', () => {
        window["devToolsExtension"] = null;
        const _service = new NgSimpleStateDevTool();
        _service.send('test', 'test')
        expect(_service.send('test', 'test')).toBe(false);
        expect(_service.isActive()).toBe(false);
        expect(window["devToolsExtension"]).toBe(null);
    });

    it('no localDevTool', () => {
        window["devToolsExtension"] = {
            name: null,
            state: null,
            connect() {
                return null;
            }
        };
        const _service = new NgSimpleStateDevTool();
        _service.send('test', 'test')
        expect(_service.send('test', 'test')).toBe(false);
        expect(_service.isActive()).toBe(false);
        expect(window["devToolsExtension"].name).toBe(null);
        expect(window["devToolsExtension"].state).toBe(null);
    });
});