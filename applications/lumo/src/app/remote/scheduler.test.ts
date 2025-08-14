import { sleep } from '../util/date';
import { RequestScheduler } from './scheduler';

describe('RequestScheduler', () => {
    // Utility to create a deferred promise
    class Deferred<T> {
        public promise: Promise<T>;

        public resolve!: (value: T) => void;

        public reject!: (error: any) => void;

        constructor() {
            this.promise = new Promise((res, rej) => {
                this.resolve = res;
                this.reject = rej;
            });
        }
    }

    it('resolves the function result', async () => {
        const scheduler = new RequestScheduler(2);
        const result = await scheduler.schedule(() => Promise.resolve(42), 'urgent');
        expect(result).toBe(42);
    });

    it('propagates rejection', async () => {
        const scheduler = new RequestScheduler(2);
        const promise = scheduler.schedule(() => Promise.reject(new Error('fail')), 'urgent');
        await expect(promise).rejects.toThrow('fail');
    });

    it('enforces max concurrent limit', async () => {
        const scheduler = new RequestScheduler(2);
        const d1 = new Deferred<string>();
        const d2 = new Deferred<string>();
        const d3 = new Deferred<string>();
        const spy1 = jest.fn(() => d1.promise);
        const spy2 = jest.fn(() => d2.promise);
        const spy3 = jest.fn(() => d3.promise);

        const p1 = scheduler.schedule(spy1, 'background');
        const p2 = scheduler.schedule(spy2, 'background');
        const p3 = scheduler.schedule(spy3, 'background');

        // Only two calls should start immediately
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).not.toHaveBeenCalled();

        // Resolve the first, freeing a slot
        d1.resolve('r1');
        await p1;
        await sleep(200);
        // Now the third should start
        expect(spy3).toHaveBeenCalledTimes(1);

        // Resolve remaining to clean up
        d2.resolve('r2');
        d3.resolve('r3');
        await Promise.all([p2, p3]);
    });

    it('prioritizes urgent over background', async () => {
        const scheduler = new RequestScheduler(1);
        const db = new Deferred<string>();
        const du = new Deferred<string>();
        const spyBg = jest.fn(() => db.promise);
        const spyUrg = jest.fn(() => du.promise);

        const pBg = scheduler.schedule(spyBg, 'background');
        const pUrg = scheduler.schedule(spyUrg, 'urgent');

        // Only background should have started initially (limit=1)
        expect(spyBg).toHaveBeenCalledTimes(1);
        expect(spyUrg).not.toHaveBeenCalled();

        // Resolve background, urgent should start next
        db.resolve('bg');
        await pBg;
        await sleep(200);
        expect(spyUrg).toHaveBeenCalledTimes(1);

        // Cleanup
        du.resolve('ur');
        await pUrg;
    });
});
