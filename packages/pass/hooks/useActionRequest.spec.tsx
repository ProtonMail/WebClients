import { Provider as ReduxProvider } from 'react-redux';

import { configureStore, createAction } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-hooks';

import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import request from '@proton/pass/store/reducers/request';

import { withRequestFailure, withRequestStart, withRequestSuccess } from '../store/actions/with-request';
import { useActionRequest } from './useActionRequest';

const start = createAction(
    'test::start',
    withRequestStart(() => ({ payload: {} }))
);

const success = createAction(
    'test::success',
    withRequestSuccess(() => ({ payload: {} }))
);

const successCache = createAction(
    'test::success::cache',
    withRequestSuccess(() => ({ payload: {} }), { maxAge: 1 })
);

const failure = createAction(
    'test::failure',
    withRequestFailure(() => ({ payload: {} }))
);

const failureCache = createAction(
    'test::failure::cache',
    withRequestFailure(() => ({ payload: {} }), { maxAge: 1 })
);

describe('useActionRequest', () => {
    it('Handles request sequence', async () => {
        const store = configureStore({ reducer: { request }, middleware: [requestMiddleware] });
        const onStart = jest.fn();
        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        const requestId = 'test';

        const hook = renderHook(
            ({ action, requestId, onStart, onSuccess, onFailure }) =>
                useActionRequest({
                    action,
                    requestId,
                    onStart,
                    onSuccess,
                    onFailure,
                }),
            {
                initialProps: { action: start, requestId, onStart, onSuccess, onFailure },
                wrapper: ({ children }) => <ReduxProvider store={store}>{children}</ReduxProvider>,
            }
        );

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            void hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            store.dispatch(success(requestId));
        });

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(100);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            void hook.result.current.dispatch();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            store.dispatch(failure(requestId));
        });

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toBe(100);
        expect(onStart).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });

    test('Revalidate should re-trigger sequence', () => {
        const store = configureStore({ reducer: { request }, middleware: [requestMiddleware] });
        const onStart = jest.fn();
        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        const requestId = 'test';

        store.dispatch(successCache(requestId));

        const hook = renderHook(
            ({ action, requestId, onStart, onSuccess, onFailure }) =>
                useActionRequest({
                    action,
                    requestId,
                    onStart,
                    onSuccess,
                    onFailure,
                }),
            {
                initialProps: { action: start, requestId, onStart, onSuccess, onFailure },
                wrapper: ({ children }) => <ReduxProvider store={store}>{children}</ReduxProvider>,
            }
        );

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            void hook.result.current.dispatch();
        });

        /* NOOP */
        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        act(() => {
            void hook.result.current.revalidate();
        });

        expect(hook.result.current.loading).toBe(true);
        expect(hook.result.current.progress).toEqual(0);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should trigger `onSuccess` immediately if cached success request', () => {
        const store = configureStore({ reducer: { request }, middleware: [requestMiddleware] });
        const onStart = jest.fn();
        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        const requestId = 'test';

        store.dispatch(successCache(requestId));

        const hook = renderHook(
            ({ action, requestId, onStart, onSuccess, onFailure }) =>
                useActionRequest({
                    action,
                    requestId,
                    onStart,
                    onSuccess,
                    onFailure,
                }),
            {
                initialProps: { action: start, requestId, onStart, onSuccess, onFailure },
                wrapper: ({ children }) => <ReduxProvider store={store}>{children}</ReduxProvider>,
            }
        );

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should trigger `onFailure` immediately if cached failed request', () => {
        const store = configureStore({ reducer: { request }, middleware: [requestMiddleware] });
        const onStart = jest.fn();
        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        const requestId = 'test';

        store.dispatch(failureCache(requestId));

        const hook = renderHook(
            ({ action, requestId, onStart, onSuccess, onFailure }) =>
                useActionRequest({
                    action,
                    requestId,
                    onStart,
                    onSuccess,
                    onFailure,
                }),
            {
                initialProps: { action: start, requestId, onStart, onSuccess, onFailure },
                wrapper: ({ children }) => <ReduxProvider store={store}>{children}</ReduxProvider>,
            }
        );

        expect(hook.result.current.loading).toBe(false);
        expect(hook.result.current.progress).toEqual(100);
        expect(onStart).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledTimes(1);
    });
});
