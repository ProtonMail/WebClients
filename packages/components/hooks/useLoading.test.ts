import { RenderResult } from '@testing-library/react-hooks';
import { renderHook } from '@testing-library/react-hooks';

import useLoading, { WithLoading } from './useLoading';

function withLoading(result: RenderResult<[boolean, WithLoading]>): WithLoading {
    return result.current[1];
}

function loading(result: RenderResult<[boolean, WithLoading]>): boolean {
    return result.current[0];
}

it('should return loading false by default', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current[0]).toEqual(false);
});

it('withLoading should resolve if there is no promise', async () => {
    const { result } = renderHook(() => useLoading());

    const resolved = await withLoading(result)(undefined);

    expect(resolved).toEqual(undefined);
    expect(loading(result)).toEqual(false);
});

it('should resolve promise and return the result', async () => {
    const { result } = renderHook(() => useLoading());

    const resolved = await withLoading(result)(Promise.resolve('resolved result'));

    expect(resolved).toEqual('resolved result');
    expect(loading(result)).toEqual(false);
});

it('should reject if promise rejects', async () => {
    const { result } = renderHook(() => useLoading());

    const error = new Error('some error');

    expect.assertions(2);
    try {
        await withLoading(result)(Promise.reject(error));
    } catch (e) {
        expect(e).toEqual(error);
        expect(loading(result)).toEqual(false);
    }
});

function createPromise() {
    let resolve!: (value?: unknown) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });

    return { promise, resolve, reject };
}

it('should render loading state', async () => {
    const { promise, resolve } = createPromise();
    const { result } = renderHook(() => useLoading());

    const wrappedPromise = withLoading(result)(promise);
    expect(loading(result)).toEqual(true);

    resolve();
    await wrappedPromise;

    expect(loading(result)).toEqual(false);
});

it('should ignore previous promises', async () => {
    const { promise: promise1, resolve: resolve1 } = createPromise();
    const { promise: promise2, resolve: resolve2 } = createPromise();

    const { result } = renderHook(() => useLoading());
    const wrappedPromise1 = withLoading(result)(promise1);
    const wrappedPromise2 = withLoading(result)(promise2);

    resolve1('First result');
    resolve2('Second result');

    expect(await wrappedPromise1).toEqual(undefined);
    expect(await wrappedPromise2).toEqual('Second result');
});

it('should ignore previous errors', async () => {
    const { promise: promise1, reject: reject1 } = createPromise();
    const { promise: promise2, reject: reject2 } = createPromise();

    const { result } = renderHook(() => useLoading());
    const wrappedPromise1 = withLoading(result)(promise1);
    const wrappedPromise2 = withLoading(result)(promise2);

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

it('should support function as an argument', async () => {
    const { result } = renderHook(() => useLoading());

    async function run(): Promise<string> {
        return 'resolved result';
    }

    const resolvedResult = await withLoading(result)(run);
    expect(resolvedResult).toEqual('resolved result');
});
