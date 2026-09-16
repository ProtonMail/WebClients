import { abortSignalAny, abortSignalAnyPolyfill } from './AbortSignalAny';

// Helper to create a comparison test between native and polyfill
function createComparisonTest(name: string, testFn: (impl: typeof AbortSignal.any) => Promise<any> | any) {
    describe(name, () => {
        it('native AbortSignal.any', async () => {
            await testFn(AbortSignal.any.bind(AbortSignal));
        });

        it('polyfill implementation', async () => {
            await testFn(abortSignalAnyPolyfill);
        });
    });
}

describe('AbortSignal.any polyfill comparison tests', () => {
    createComparisonTest('Empty array', (impl) => {
        const signal = impl([]);
        expect(signal.aborted).toBe(false);
        expect(signal.reason).toBeUndefined();
    });

    createComparisonTest('Single non-aborted signal', (impl) => {
        const controller = new AbortController();
        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(false);
        expect(signal.reason).toBeUndefined();
    });

    createComparisonTest('Single already-aborted signal', (impl) => {
        const controller = new AbortController();
        const reason = 'Test abort reason';
        controller.abort(reason);

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    createComparisonTest('Multiple non-aborted signals', (impl) => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();
        const controller3 = new AbortController();

        const signal = impl([controller1.signal, controller2.signal, controller3.signal]);

        expect(signal.aborted).toBe(false);
        expect(signal.reason).toBeUndefined();
    });

    createComparisonTest('Multiple signals, one already aborted', (impl) => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();
        const controller3 = new AbortController();

        const reason = 'Second signal aborted';
        controller2.abort(reason);

        const signal = impl([controller1.signal, controller2.signal, controller3.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    createComparisonTest('Signal aborts after creation', async (impl) => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();

        const signal = impl([controller1.signal, controller2.signal]);

        expect(signal.aborted).toBe(false);

        const reason = 'Aborted later';

        const abortPromise = new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
        });

        controller1.abort(reason);

        await abortPromise;

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    createComparisonTest('Reason propagation from different signals', (impl) => {
        const reasons = ['Reason 1', 'Reason 2', 'Reason 3'];

        reasons.forEach((expectedReason, index) => {
            const controllers = [new AbortController(), new AbortController(), new AbortController()];

            controllers[index].abort(expectedReason);

            const signal = impl(controllers.map((c) => c.signal));

            expect(signal.aborted).toBe(true);
            expect(signal.reason).toBe(expectedReason);
        });
    });

    createComparisonTest('Multiple signals abort simultaneously', async (impl) => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();

        const signal = impl([controller1.signal, controller2.signal]);

        const abortPromise = new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
        });

        const reason1 = 'First reason';
        const reason2 = 'Second reason';

        controller1.abort(reason1);
        controller2.abort(reason2);

        await abortPromise;

        expect(signal.aborted).toBe(true);
        expect([reason1, reason2]).toContain(signal.reason);
    });

    createComparisonTest('Signal with default reason when none provided', (impl) => {
        const controller = new AbortController();
        controller.abort();

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBeInstanceOf(DOMException);
        expect((signal.reason as DOMException).name).toBe('AbortError');
        expect((signal.reason as DOMException).message).toBe('The operation was aborted.');
    });

    createComparisonTest('Signal with explicit null reason', (impl) => {
        const controller = new AbortController();
        controller.abort(null);

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(null);
    });

    createComparisonTest('Signal with explicit undefined reason', (impl) => {
        const controller = new AbortController();
        controller.abort(undefined);

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBeInstanceOf(DOMException);
        expect((signal.reason as DOMException).name).toBe('AbortError');
    });

    createComparisonTest('Signal with object reason', (impl) => {
        const controller = new AbortController();
        const reason = { message: 'Custom abort', code: 123 };
        controller.abort(reason);

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    createComparisonTest('Signal with Error reason', (impl) => {
        const controller = new AbortController();
        const reason = new Error('Abort error');
        controller.abort(reason);

        const signal = impl([controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    createComparisonTest('Race condition: signal aborts during listener setup', async (impl) => {
        const controller = new AbortController();
        const reason = 'Race condition test';

        setTimeout(() => controller.abort(reason), 0);

        const signal = impl([controller.signal]);

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });
});
describe('Memory leak prevention (polyfill specific)', () => {
    it('should clean up event listeners when signal aborts', () => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();

        const addEventListenerSpy = jest.spyOn(controller1.signal, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(controller1.signal, 'removeEventListener');

        abortSignalAnyPolyfill([controller1.signal, controller2.signal]);

        expect(addEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));

        controller1.abort('test');

        expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('should not leak listeners with already aborted signals', () => {
        const controller = new AbortController();
        controller.abort('already aborted');

        const addEventListenerSpy = jest.spyOn(controller.signal, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(controller.signal, 'removeEventListener');

        const resultSignal = abortSignalAnyPolyfill([controller.signal]);

        expect(addEventListenerSpy).toHaveBeenCalled();
        expect(removeEventListenerSpy).toHaveBeenCalled();

        expect(resultSignal.aborted).toBe(true);

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });
});

describe('Edge cases', () => {
    it('should handle signals that are aborted with different timing', async () => {
        const controllers = [new AbortController(), new AbortController(), new AbortController()];

        const signal = abortSignalAny(controllers.map((c) => c.signal));

        const abortPromise = new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
        });

        setTimeout(() => controllers[2].abort('third'), 5);
        setTimeout(() => controllers[1].abort('second'), 3);
        setTimeout(() => controllers[0].abort('first'), 1);

        await abortPromise;

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe('first');
    });

    it('should work with the same signal passed multiple times', () => {
        const controller = new AbortController();
        const reason = 'duplicate signal';

        controller.abort(reason);

        const signal = abortSignalAny([controller.signal, controller.signal, controller.signal]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe(reason);
    });

    it('should handle mixed aborted and non-aborted signals', async () => {
        const abortedController = new AbortController();
        const nonAbortedController = new AbortController();
        const laterAbortedController = new AbortController();

        abortedController.abort('already aborted');

        const signal = abortSignalAny([
            nonAbortedController.signal,
            abortedController.signal,
            laterAbortedController.signal,
        ]);

        expect(signal.aborted).toBe(true);
        expect(signal.reason).toBe('already aborted');
    });
});
