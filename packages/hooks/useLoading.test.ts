import { act, renderHook } from '@testing-library/react-hooks';

import useLoading from '@proton/hooks/useLoading';

const createPromise = () => {
    let resolve!: (value?: unknown) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });

    return { promise, resolve, reject };
};

describe('useLoading', () => {
    it('returns loading false by default', () => {
        const { result } = renderHook(() => useLoading());
        const [loading] = result.current;

        expect(loading).toEqual(false);
    });

    it('allows setting of initial loading state', () => {
        const { result } = renderHook(() => useLoading(true));
        const [loading] = result.current;

        expect(loading).toEqual(true);
    });

    it('resolves withLoading if there is no promise', async () => {
        const { result } = renderHook(() => useLoading());
        const [loading, withLoading] = result.current;

        const resolved = await withLoading(undefined);

        expect(resolved).toEqual(undefined);
        expect(loading).toEqual(false);
    });

    it('resolves promise and returns the result', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;

        await act(async () => {
            const resolved = await withLoading(Promise.resolve('resolved result'));

            expect(resolved).toEqual('resolved result');
        });

        const [loading] = result.current;
        expect(loading).toEqual(false);
    });

    it('rejects if promise rejects', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const error = new Error('some error');

        expect.assertions(2);
        await act(async () => {
            try {
                await withLoading(Promise.reject(error));
            } catch (e) {
                expect(e).toEqual(error);
            }
        });

        const [loading] = result.current;
        expect(loading).toEqual(false);
    });

    it('renders loading state', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const { promise, resolve } = createPromise();

        let wrappedPromise: Promise<unknown>;
        act(() => {
            wrappedPromise = withLoading(promise);
        });

        let [loading] = result.current;
        expect(loading).toEqual(true);

        await act(async () => {
            resolve();
            await wrappedPromise;
        });

        [loading] = result.current;
        expect(loading).toEqual(false);
    });

    it('ignores previous promises', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;

        const { promise: promise1, resolve: resolve1 } = createPromise();
        const { promise: promise2, resolve: resolve2 } = createPromise();

        await act(async () => {
            const wrappedPromise1 = withLoading(promise1);
            const wrappedPromise2 = withLoading(promise2);

            resolve1('First result');
            resolve2('Second result');

            expect(await wrappedPromise1).toEqual(undefined);
            expect(await wrappedPromise2).toEqual('Second result');
        });
    });

    it('ignores previous errors', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;

        const { promise: promise1, reject: reject1 } = createPromise();
        const { promise: promise2, reject: reject2 } = createPromise();

        await act(async () => {
            const wrappedPromise1 = withLoading(promise1);
            const wrappedPromise2 = withLoading(promise2);

            let handledFirstReject = false;
            wrappedPromise1.catch(() => {
                handledFirstReject = true;
            });

            let handledSecondReject = false;
            wrappedPromise2.catch(() => {
                handledSecondReject = true;
            });

            reject1('First reject reason');
            reject2('Second reject reason');

            // Handle promises before doing the checks. Switching the control flow in the event loop.
            expect.assertions(3);
            await new Promise((resolve) => setTimeout(resolve));

            expect(handledFirstReject).toEqual(false);
            expect(handledSecondReject).toEqual(true);
            expect(await wrappedPromise1).toEqual(undefined);
        });
    });

    it('supports functions as an argument', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;

        async function run(): Promise<string> {
            return 'resolved result';
        }
        await act(async () => {
            const resolvedResult = await withLoading(run);

            expect(resolvedResult).toEqual('resolved result');
        });
    });

    it('exposes setLoading', async () => {
        const { result } = renderHook(() => useLoading());
        const [, , setLoading] = result.current;

        act(() => {
            setLoading(true);
        });

        const [loading] = result.current;
        expect(loading).toBe(true);
    });
});
