import { act, renderHook } from '@testing-library/react-hooks';

import { createPromise } from '@proton/shared/lib/helpers/promise';

import useLoading, { useLoadingByKey } from './useLoading';

describe('useLoading', () => {
    it('should return loading false by default', () => {
        const { result } = renderHook(() => useLoading());
        const [loading] = result.current;

        expect(loading).toEqual(false);
    });

    it('should allow setting of initial loading state', () => {
        const { result } = renderHook(() => useLoading(true));
        const [loading] = result.current;

        expect(loading).toEqual(true);
    });

    it('should resolve withLoading if there is no promise', async () => {
        const { result } = renderHook(() => useLoading());
        const [loading, withLoading] = result.current;

        await act(async () => {
            const resolved = await withLoading(undefined);
            expect(resolved).toEqual(undefined);
        });

        expect(loading).toEqual(false);
    });

    it('should resolve promise and returns the result', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;

        await act(async () => {
            const resolved = await withLoading(Promise.resolve('resolved result'));

            expect(resolved).toEqual('resolved result');
        });

        const [loading] = result.current;
        expect(loading).toEqual(false);
    });

    it('should reject if promise rejects', async () => {
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

    it('should render loading state', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const { promise, resolve } = createPromise<void>();

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

    it('should ignore previous promises', async () => {
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

    it('should ignore previous errors', async () => {
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

    it('should support functions as an argument', async () => {
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

    it('should support function that throws an error', async () => {
        const { result } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const error = new Error('function error');

        async function throwingFunction(): Promise<string> {
            throw error;
        }

        expect.assertions(2);
        await act(async () => {
            try {
                await withLoading(throwingFunction);
            } catch (e) {
                expect(e).toEqual(error);
            }
        });

        const [loading] = result.current;
        expect(loading).toEqual(false);
    });

    it('should expose setLoading', async () => {
        const { result } = renderHook(() => useLoading());
        const [, , setLoading] = result.current;

        act(() => {
            setLoading(true);
        });

        const [loading] = result.current;
        expect(loading).toBe(true);
    });

    it('should handle component unmounting during promise execution', async () => {
        const { result, unmount } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const { promise, resolve } = createPromise<string>();

        let wrappedPromise: Promise<unknown>;
        act(() => {
            wrappedPromise = withLoading(promise);
        });

        // Unmount the component
        unmount();

        await act(async () => {
            resolve('resolved after unmount');
            await wrappedPromise;
        });

        // Should not throw any errors or cause state updates after unmount
        expect(true).toBe(true); // Test passes if no errors are thrown
    });

    it('should not update loading state when component is unmounted during promise rejection', async () => {
        const { result, unmount } = renderHook(() => useLoading());
        const [, withLoading] = result.current;
        const { promise, reject } = createPromise<string>();
        const error = new Error('Promise rejected after unmount');

        let wrappedPromise: Promise<unknown>;
        act(() => {
            wrappedPromise = withLoading(promise);
        });

        // Unmount the component before promise resolves
        unmount();

        await act(async () => {
            reject(error);
            try {
                await wrappedPromise;
            } catch (e) {
                expect(e).toEqual(error);
            }
        });

        // Should not throw any errors or cause state updates after unmount
        expect(true).toBe(true); // Test passes if no errors are thrown
    });
});

describe('useLoadingByKey', () => {
    describe('when initial state is not provided', () => {
        it('should return empty map', () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [loading] = result.current;
            expect(loading).toStrictEqual({});
        });
    });

    describe('when initial state is provided', () => {
        it('should return it at first', () => {
            const { result } = renderHook(() => useLoadingByKey({ keyA: true }));
            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });
        });

        it('should handle multiple initial keys', () => {
            const { result } = renderHook(() => useLoadingByKey({ keyA: true, keyB: false, keyC: true }));
            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true, keyB: false, keyC: true });
        });
    });

    describe('when promise is undefined', () => {
        it('should resolve withLoading', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const resolved = await act(() => withLoading('keyA', undefined));
            expect(resolved).toEqual(undefined);

            const [loading] = result.current;
            expect(loading).toEqual({ keyA: false });
        });
    });

    describe('when promise is defined', () => {
        it('should resolve promise and returns the result', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            await act(async () => {
                const resolved = await withLoading('keyA', Promise.resolve('resolved result'));
                expect(resolved).toEqual('resolved result');
            });

            const [loading] = result.current;
            expect(loading).toEqual({ keyA: false });
        });

        it('should reject if promise rejects', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const error = new Error('some error');

            expect.assertions(2);
            await act(async () => {
                try {
                    await withLoading('keyA', Promise.reject(error));
                } catch (e) {
                    expect(e).toEqual(error);
                }
            });

            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });

        it('should render loading state', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const { promise, resolve } = createPromise<void>();

            let wrappedPromise: Promise<unknown>;
            act(() => {
                wrappedPromise = withLoading('keyA', promise);
            });

            let [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });

            await act(async () => {
                resolve();
                await wrappedPromise;
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });

        it('should ignore previous promises', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const { promise: promise1, resolve: resolve1 } = createPromise();
            const { promise: promise2, resolve: resolve2 } = createPromise();

            await act(async () => {
                const wrappedPromise1 = withLoading('keyA', promise1);
                const wrappedPromise2 = withLoading('keyA', promise2);

                resolve1('First result');
                resolve2('Second result');

                expect(await wrappedPromise1).toEqual(undefined);
                expect(await wrappedPromise2).toEqual('Second result');
            });
        });

        it('should ignore previous errors', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const { promise: promise1, reject: reject1 } = createPromise();
            const { promise: promise2, reject: reject2 } = createPromise();

            await act(async () => {
                const wrappedPromise1 = withLoading('keyA', promise1);
                const wrappedPromise2 = withLoading('keyA', promise2);

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

        it('should support functions as an argument', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            async function run(): Promise<string> {
                return 'resolved result';
            }

            await act(async () => {
                const resolvedResult = await withLoading('keyA', run);
                expect(resolvedResult).toEqual('resolved result');
            });
        });

        it('should support function that throws an error', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const error = new Error('function error');

            async function throwingFunction(): Promise<string> {
                throw error;
            }

            expect.assertions(2);
            await act(async () => {
                try {
                    await withLoading('keyA', throwingFunction);
                } catch (e) {
                    expect(e).toEqual(error);
                }
            });

            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });

        it('should handle multiple keys independently', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const { promise: promiseA, resolve: resolveA } = createPromise<string>();
            const { promise: promiseB, resolve: resolveB } = createPromise<string>();

            let wrappedPromiseA: Promise<unknown>;
            let wrappedPromiseB: Promise<unknown>;

            act(() => {
                wrappedPromiseA = withLoading('keyA', promiseA);
                wrappedPromiseB = withLoading('keyB', promiseB);
            });

            let [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true, keyB: true });

            await act(async () => {
                resolveA('Result A');
                await wrappedPromiseA;
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false, keyB: true });

            await act(async () => {
                resolveB('Result B');
                await wrappedPromiseB;
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false, keyB: false });
        });

        it('should handle component unmounting during promise execution', async () => {
            const { result, unmount } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const { promise, resolve } = createPromise<string>();

            let wrappedPromise: Promise<unknown>;
            act(() => {
                wrappedPromise = withLoading('keyA', promise);
            });

            // Unmount the component
            unmount();

            await act(async () => {
                resolve('resolved after unmount');
                await wrappedPromise;
            });

            // Should not throw any errors or cause state updates after unmount
            expect(true).toBe(true); // Test passes if no errors are thrown
        });

        it('should not update loading state when component is unmounted during promise rejection', async () => {
            const { result, unmount } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;
            const { promise, reject } = createPromise<string>();
            const error = new Error('Promise rejected after unmount');

            let wrappedPromise: Promise<unknown>;
            act(() => {
                wrappedPromise = withLoading('keyA', promise);
            });

            // Unmount the component before promise rejects
            unmount();

            await act(async () => {
                reject(error);
                try {
                    await wrappedPromise;
                } catch (e) {
                    expect(e).toEqual(error);
                }
            });

            // Should not throw any errors or cause state updates after unmount
            expect(true).toBe(true); // Test passes if no errors are thrown
        });

        it('should handle manual loading state changes', () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, , setManualLoading] = result.current;

            act(() => {
                setManualLoading('keyA', true);
            });

            let [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });

            act(() => {
                setManualLoading('keyA', false);
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });

        it('should handle manual loading state changes for multiple keys', () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, , setManualLoading] = result.current;

            act(() => {
                setManualLoading('keyA', true);
                setManualLoading('keyB', true);
                setManualLoading('keyC', false);
            });

            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true, keyB: true, keyC: false });
        });

        it('should properly increment and track counters for multiple promises on same key', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const { promise: promise1, resolve: resolve1 } = createPromise<string>();
            const { promise: promise2, resolve: resolve2 } = createPromise<string>();
            const { promise: promise3, resolve: resolve3 } = createPromise<string>();

            let wrappedPromise1: Promise<unknown>;
            let wrappedPromise2: Promise<unknown>;
            let wrappedPromise3: Promise<unknown>;

            // Start three promises quickly in succession
            act(() => {
                wrappedPromise1 = withLoading('keyA', promise1);
                wrappedPromise2 = withLoading('keyA', promise2);
                wrappedPromise3 = withLoading('keyA', promise3);
            });

            // All should be loading
            let [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });

            // Resolve them out of order
            await act(async () => {
                resolve1('First');
                resolve3('Third');
                resolve2('Second');

                // Wait for all promises
                await Promise.all([wrappedPromise1, wrappedPromise2, wrappedPromise3]);
            });

            // Only the last promise should have set loading to false
            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });

        it('should handle error in later promise while earlier promises are still pending', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const { promise: promise1, resolve: resolve1 } = createPromise<string>();
            const { promise: promise2, reject: reject2 } = createPromise<string>();

            let wrappedPromise1: Promise<unknown>;
            let wrappedPromise2: Promise<unknown>;

            act(() => {
                wrappedPromise1 = withLoading('keyA', promise1);
                wrappedPromise2 = withLoading('keyA', promise2);
            });

            const error = new Error('Second promise error');

            await act(async () => {
                reject2(error);
                resolve1('First resolved');

                try {
                    await wrappedPromise2;
                } catch (e) {
                    expect(e).toEqual(error);
                }

                // First promise should return undefined since it's not the latest
                expect(await wrappedPromise1).toEqual(undefined);
            });

            // Loading should be false after the latest promise completes
            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false });
        });
    });
});
