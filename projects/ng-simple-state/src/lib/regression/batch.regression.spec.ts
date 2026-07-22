import { createThrottledUpdater } from '../batch/ng-simple-state-batch';

interface CounterState {
  count: number;
}

describe('Regression: createThrottledUpdater', () => {
  it('should merge the patches queued within the same window', () =>
    new Promise<void>((done) => {
      const applied: Partial<CounterState & { name: string }>[] = [];
      const { update } = createThrottledUpdater<CounterState & { name: string }>(
        (state) => applied.push(state),
        50,
      );

      update({ count: 1 }); // applied immediately
      update({ name: 'x' }); // queued
      update({ count: 2 }); // must merge with the queued patch, not replace it

      setTimeout(() => {
        expect(applied.length).toBe(2);
        expect(applied[0]).toEqual({ count: 1 });
        expect(applied[1]).toEqual({ name: 'x', count: 2 });
        done();
      }, 200);
    }));

  it('should drop the queued patch when cancelled', () =>
    new Promise<void>((done) => {
      const applied: Partial<CounterState>[] = [];
      const { update, cancel } = createThrottledUpdater<CounterState>(
        (state) => applied.push(state),
        50,
      );

      update({ count: 1 });
      update({ count: 2 });
      cancel();

      setTimeout(() => {
        expect(applied).toEqual([{ count: 1 }]);
        done();
      }, 200);
    }));
});
