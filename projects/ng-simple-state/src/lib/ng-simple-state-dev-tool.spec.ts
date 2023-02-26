import { NgSimpleStateDevTool } from './ng-simple-state-dev-tool';

export class DevToolsExtension {
    name: string | null = null;
    state: string | null = null;

    connect(): any {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            send: (name: string, state: any) => {
                self.name = name;
                self.state = state;
            },
            init: () => {}
        };
    }
}

describe('NgSimpleStateDevTool', () => {

    it('enableDevTool active', () => {
        (window as any)['devToolsExtension'] = new DevToolsExtension();
        const service = new NgSimpleStateDevTool({runOutsideAngular: (cbk: any) => cbk() } as any);
        expect(service.isActive()).toBe(true);
        expect(service.send('test', 'test1', 'test2')).toBe(true);
        expect((window as any)['devToolsExtension'].name).toBe('test.test1');
        expect((window as any)['devToolsExtension'].state).toEqual({ test: 'test2' });
    });

    it('no devToolsExtension', () => {
        (window as any)['devToolsExtension'] = null;
        const service = new NgSimpleStateDevTool({runOutsideAngular: (cbk: any) => cbk() } as any);
        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect((window as any)['devToolsExtension']).toBe(null);
    });

    it('no localDevTool', () => {
        (window as any)['devToolsExtension'] = {
            name: null,
            state: null,
            connect(): any {
                return null;
            }
        };
        const service = new NgSimpleStateDevTool({runOutsideAngular: (cbk: any) => cbk() } as any);
        service.send('test', 'test', 'test');
        expect(service.send('test', 'test', 'test')).toBe(false);
        expect(service.isActive()).toBe(false);
        expect((window as any)['devToolsExtension'].name).toBe(null);
        expect((window as any)['devToolsExtension'].state).toBe(null);
    });
});
