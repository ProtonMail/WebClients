import { act, renderHook } from '@testing-library/react-hooks';

import useLoading, { useLoadingByKey } from '@proton/hooks/useLoading';
import { createPromise } from '@proton/shared/lib/helpers/promise';

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

    it('should expose setLoading', async () => {
        const { result } = renderHook(() => useLoading());
        const [, , setLoading] = result.current;

        act(() => {
            setLoading(true);
        });

        const [loading] = result.current;
        expect(loading).toBe(true);
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

        it('should expose setLoading', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, , setLoading] = result.current;

            act(() => {
                setLoading('keyA', true);
            });

            const [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });
        });
    });

    describe('when several keys are used', () => {
        it('should not conflict between each other', async () => {
            const { result } = renderHook(() => useLoadingByKey());
            const [, withLoading] = result.current;

            const { promise: promise1, resolve: resolve1 } = createPromise();
            const { promise: promise2, resolve: resolve2 } = createPromise();

            let wrappedPromise1: Promise<unknown>;
            let wrappedPromise2: Promise<unknown>;

            await act(async () => {
                wrappedPromise1 = withLoading('keyA', promise1);
            });

            let [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true });

            await act(async () => {
                wrappedPromise2 = withLoading('keyB', promise2);
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true, keyB: true });

            await act(async () => {
                resolve2('Second result');
                expect(await wrappedPromise2).toEqual('Second result');
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: true, keyB: false });

            await act(async () => {
                resolve1('First result');
                expect(await wrappedPromise1).toEqual('First result');
            });

            [loading] = result.current;
            expect(loading).toStrictEqual({ keyA: false, keyB: false });
        });
    });
});
