/**
 * Test double for the Redux DevTools browser extension.
 *
 * It lives outside any `.spec.ts` file on purpose: importing a spec from another
 * spec makes the test runner re-execute its `describe` blocks in every importer.
 */
export class DevToolsExtension {
  name: string | null = null;
  state: string | null = null;
  /** Every action name the panel received, in order */
  readonly sent: string[] = [];
  /** The listener the library subscribed with, to play panel events back */
  listener?: (message: any) => void;

  connect(): any {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      send: (name: string, state: any) => {
        self.name = name;
        self.state = state;
        self.sent.push(name);
      },
      init: () => {
        // ...
      },
      subscribe: (listener: (message: any) => void) => {
        self.listener = listener;
        return () => {};
      },
    };
  }

  /** Play back a `DISPATCH` message, as the panel does on a user action */
  dispatch(type: string, state?: unknown): void {
    this.listener?.({
      type: 'DISPATCH',
      payload: { type },
      state: state === undefined ? undefined : JSON.stringify(state),
    });
  }
}
