import type { PropsWithChildren, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import type { EnhancedStore, UnknownAction } from '@reduxjs/toolkit';
import { configureStore, createAction } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-hooks';

import { withRequest } from '@proton/pass/store/request/enhancers';
import { requestMiddleware } from '@proton/pass/store/request/middleware';
import request from '@proton/pass/store/request/reducer';

import { useActionRequest } from './useRequest';

const requestId = 'test::id';

const start = createAction('test::start', () => withRequest({ status: 'start', id: requestId })({ payload: {} }));
const success = createAction('test::success', () => withRequest({ status: 'success', id: requestId })({ payload: {} }));
const failure = createAction('test::failure', () => withRequest({ status: 'failure', id: requestId })({ payload: {} }));
const progress = createAction('test::progress', (progress: number) =>
    withRequest({ status: 'progress', id: requestId, progress })({ payload: {} })
);

const successCache = createAction('test::success::cache', () =>
    withRequest({ status: 'success', id: requestId, maxAge: 1 })({ payload: {} })
);

const buildHook = (
    useInitialRequestId: boolean = true,
    initialActions: UnknownAction[] = [],
    setup?: (store: EnhancedStore) => void
) => {
    const store = configureStore({ reducer: { request }, middleware: (mw) => mw().concat(requestMiddleware) });
    setup?.(store);

    initialActions.forEach((action) => store.dispatch(action));

    const onStart = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    return {
        store,
        dispatch: (action: UnknownAction): void => {
            store.dispatch(action);
        },
        onStart,
        onSuccess,
        onFailure,
        hook: renderHook<PropsWithChildren, ReturnType<typeof useActionRequest>>(
            () =>
                useActionRequest(start, {
                    requestId: useInitialRequestId ? requestId : undefined,
                    onStart,
                    onSuccess,
                    onFailure,
                }),
            {
                wrapper: (({ children }: { children: ReactNode }) => (
                    <ReduxProvider store={store}>{children}</ReduxProvider>
                )) as any,
            }
        ),
    };
};

describe('useActionRequest', () => {
    test('Handles request sequence', async () => {
        const { hook, dispatch, onStart, onSuccess, onFailure } = buildHook();

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => hook.result.current.dispatch());

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.progress),
            act(() => dispatch(progress(42))),
        ]);

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(42);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.progress),
            act(() => dispatch(progress(100))),
        ]);

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.loading),
            act(() => dispatch(success())),
        ]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => hook.result.current.dispatch());

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.loading),
            act(() => dispatch(failure())),
        ]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });

    test('Should handle cached request', async () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [successCache()]);

        act(() => hook.result.current.dispatch());
        await hook.waitForValueToChange(() => hook.result.current.loading);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should handle revalidation if cached request', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [successCache()]);

        act(() => hook.result.current.revalidate());

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Dispatching the same action should be throttled', async () => {
        const { hook, dispatch, onStart, onSuccess, onFailure } = buildHook(false, []);

        act(() => hook.result.current.dispatch());
        act(() => hook.result.current.dispatch());
        act(() => hook.result.current.dispatch());
        act(() => hook.result.current.dispatch());
        act(() => hook.result.current.dispatch());

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.loading),
            act(() => dispatch(success())),
        ]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Revalidating after dispatch while in-flight should noop', async () => {
        const { hook, dispatch, onStart, onSuccess, onFailure } = buildHook(false, []);

        act(() => hook.result.current.dispatch());
        act(() => hook.result.current.revalidate());

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.loading),
            act(() => dispatch(success())),
        ]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should handle aysnc dispatch throwing', async () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(false, [], (store) => {
            const dispatch = jest.spyOn(store, 'dispatch');
            dispatch.mockImplementation(() => Promise.reject(new Error()) as any);
        });

        await Promise.all([
            hook.waitForValueToChange(() => hook.result.current.error),
            act(() => hook.result.current.dispatch()),
        ]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });
});
