import { createRAFController } from './raf';

describe('createRAFController', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should execute the callback', () => {
        const controller = createRAFController();
        const fn = jest.fn();

        controller.request(fn);

        jest.runAllTimers();
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(expect.any(Number));
    });

    test('should cancel pending requests', () => {
        const controller = createRAFController();
        const fn = jest.fn();

        controller.request(fn);
        controller.cancel();

        jest.runAllTimers();
        expect(fn).not.toHaveBeenCalled();
    });

    test('should track the handle', () => {
        const controller = createRAFController();
        const fn = jest.fn();

        expect(controller.handle).toBeNull();

        controller.request(fn);
        expect(controller.handle).toBeGreaterThan(0);

        controller.cancel();
        expect(controller.handle).toBeNull();
    });

    test('should replace pending request with new one', () => {
        const controller = createRAFController();
        const fn1 = jest.fn();
        const fn2 = jest.fn();

        controller.request(fn1);
        controller.request(fn2);
        jest.runAllTimers();

        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('should allow async callbacks with handle checks', async () => {
        const controller = createRAFController();
        const results: string[] = [];

        const asyncFactory = (id: string) => async (handle: number) => {
            results.push(`${id}::started`);
            await Promise.resolve();

            if (controller.handle == handle) results.push(`${id}::completed`);
            else results.push(`${id}::cancelled`);
        };

        controller.request(asyncFactory('1'));
        const firstHandle = controller.handle;
        jest.runAllTimers();

        controller.request(asyncFactory('2'));
        await jest.runAllTimersAsync();

        expect(results).toEqual(['1::started', '1::cancelled', '2::started', '2::completed']);
        expect(controller.handle).not.toBe(firstHandle);
    });
});
