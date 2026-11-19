import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import type { EnhancedStore, UnknownAction } from '@reduxjs/toolkit';
import { configureStore, createAction } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';

import { withRequest } from '../store/request/enhancers';
import { requestMiddleware } from '../store/request/middleware';
import request from '../store/request/reducer';
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

    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    return {
        store,
        dispatch: (action: UnknownAction): void => {
            store.dispatch(action);
        },
        onStart,
        onSuccess,
        onFailure,
        hook: renderHook(
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

        act(() => dispatch(progress(42)));
        await waitFor(() => expect(hook.result.current.progress).toEqual(42));

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(42);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => dispatch(progress(100)));
        await waitFor(() => expect(hook.result.current.progress).toEqual(100));

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => dispatch(success()));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

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

        act(() => dispatch(failure()));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });

    test('Should handle cached request', async () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [successCache()]);

        act(() => hook.result.current.dispatch());
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

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

        act(() => dispatch(success()));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

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

        act(() => dispatch(success()));
        await waitFor(() => expect(hook.result.current.loading).toBe(false));

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should handle aysnc dispatch throwing', async () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(false, [], (store) => {
            const dispatch = vi.spyOn(store, 'dispatch');
            dispatch.mockImplementation(() => Promise.reject(new Error()) as any);
        });

        act(() => hook.result.current.dispatch());
        await waitFor(() => expect(hook.result.current.error).toBe(true));

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });
});
