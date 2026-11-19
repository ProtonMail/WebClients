import type { RafHandle } from './raf';
import { createRAFController } from './raf';

describe('createRAFController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('should execute the callback', () => {
        const controller = createRAFController();
        const fn = vi.fn();

        controller.request(fn);

        vi.runAllTimers();
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith({ cancelled: false });
    });

    test('should cancel pending requests', () => {
        const controller = createRAFController();
        const fn = vi.fn();

        controller.request(fn);
        controller.cancel();

        vi.runAllTimers();
        expect(fn).not.toHaveBeenCalled();
    });

    test('should track the handle', () => {
        const controller = createRAFController();
        const fn = vi.fn();

        expect(controller.handle).toBeNull();

        controller.request(fn);
        expect(controller.handle).toBeGreaterThan(0);

        controller.cancel();
        expect(controller.handle).toBeNull();
    });

    test('should replace pending request with new one', () => {
        const controller = createRAFController();
        const fn1 = vi.fn();
        const fn2 = vi.fn();

        controller.request(fn1);
        controller.request(fn2);
        vi.runAllTimers();

        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('should allow async callbacks with handle checks', async () => {
        const controller = createRAFController();
        const results: string[] = [];

        const asyncFactory = (id: string) => async (handle: RafHandle) => {
            results.push(`${id}::started`);
            await Promise.resolve();

            if (!handle.cancelled) results.push(`${id}::completed`);
            else results.push(`${id}::cancelled`);
        };

        controller.request(asyncFactory('1'));
        const firstHandle = controller.handle;
        vi.runAllTimers();

        controller.request(asyncFactory('2'));
        await vi.runAllTimersAsync();

        expect(results).toEqual(['1::started', '1::cancelled', '2::started', '2::completed']);
        expect(controller.handle).not.toBe(firstHandle);
    });
});
