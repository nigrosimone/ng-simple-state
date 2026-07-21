/**
 * Test double for the Redux DevTools browser extension.
 *
 * It lives outside any `.spec.ts` file on purpose: importing a spec from another
 * spec makes the test runner re-execute its `describe` blocks in every importer.
 */
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
            init: () => {
                // ...
            },
            subscribe: () => {
                return () => { };
            }
        };
    }
}
