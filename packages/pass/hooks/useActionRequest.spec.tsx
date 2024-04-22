import type { PropsWithChildren, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { type UnknownAction, configureStore, createAction } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-hooks';

import { withRequest } from '@proton/pass/store/request/enhancers';
import { requestMiddleware } from '@proton/pass/store/request/middleware';
import request from '@proton/pass/store/request/reducer';

import { useActionRequest } from './useActionRequest';

const requestId = 'test::id';

const start = createAction('test::start', () => withRequest({ status: 'start', id: requestId })({ payload: {} }));
const success = createAction('test::success', () => withRequest({ status: 'success', id: requestId })({ payload: {} }));
const failure = createAction('test::failure', () => withRequest({ status: 'failure', id: requestId })({ payload: {} }));

const successCache = createAction('test::success::cache', () =>
    withRequest({ status: 'success', id: requestId, maxAge: 1 })({ payload: {} })
);

const buildHook = (useInitialRequestId: boolean = true, initialActions: UnknownAction[] = []) => {
    const store = configureStore({ reducer: { request }, middleware: (mw) => mw().concat(requestMiddleware) });
    initialActions.forEach((action) => store.dispatch(action));

    const onStart = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    return {
        store,
        onStart,
        onSuccess,
        onFailure,
        hook: renderHook<PropsWithChildren, ReturnType<typeof useActionRequest>>(
            () =>
                useActionRequest(start, {
                    initialRequestId: useInitialRequestId ? requestId : undefined,
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
    it('Handles request sequence', async () => {
        const { hook, onStart, onSuccess, onFailure, store } = buildHook();

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            store.dispatch(success());
        });

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(100);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            store.dispatch(failure());
        });

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(100);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });

    test('Revalidate should re-trigger sequence', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [successCache()]);

        act(() => {
            hook.result.current.revalidate();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('dispatching should noop if request success with maxAge', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(false, [successCache()]);

        act(() => {
            hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('dispatching the same action should only trigger effect once', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(false, []);

        act(() => {
            hook.result.current.dispatch();
            hook.result.current.dispatch();
            hook.result.current.dispatch();
            hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Setting `initialRequestId` should trigger `onStart`', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [start()]);

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Setting `initialRequestId` should trigger `onSuccess`', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [success()]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Setting `initialRequestId` should trigger `onFailure`', () => {
        const { hook, onStart, onSuccess, onFailure } = buildHook(true, [failure()]);

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledTimes(1);
    });
});
