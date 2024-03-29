import { useCallback, useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import {
    baseUseDispatch as useDispatch,
    baseUseSelector as useSelector,
} from '@proton/redux-shared-store/sharedContext';

import type { ReducerValue } from './interface';

const createQueue = <T>() => {
    let queue: T[] = [];
    const enqueue = (value: T) => {
        return queue.push(value);
    };
    const consume = (cb: (value: T) => void) => {
        queue.forEach(cb);
        queue.length = 0;
    };
    let symbol: Symbol;
    const resetId = () => {
        symbol = Symbol('debug');
    };
    resetId();
    return {
        enqueue,
        consume,
        resetId,
        getId: () => symbol,
    };
};

const queue = createQueue();

export const useModelThunkDispatcher = (store: any) => {
    useEffect(() => {
        const dispatchAll = () => {
            queue.consume((thunk: any) => store.dispatch(thunk()));
        };

        let queued = false;
        let cancel: () => void;
        const consume = () => {
            if (queued) {
                return;
            }

            queued = true;
            // Not supported on safari
            if (!!globalThis.requestIdleCallback) {
                const handle = requestIdleCallback(
                    () => {
                        queued = false;
                        dispatchAll();
                    },
                    { timeout: 100 }
                );
                cancel = () => {
                    cancelIdleCallback(handle);
                };
            } else {
                const handle = setTimeout(() => {
                    queued = false;
                    dispatchAll();
                }, 10);
                cancel = () => {
                    clearTimeout(handle);
                };
            }
        };

        const originalEnqueue = queue.enqueue;
        queue.enqueue = (newThunk: any) => {
            const result = originalEnqueue(newThunk);
            consume();
            return result;
        };
        consume();
        return () => {
            queue.enqueue = originalEnqueue;
            queue.resetId();
            cancel();
        };
    }, [store]);
};

export const createHooks = <State, Extra, Returned, ThunkArg = void>(
    thunk: (arg?: ThunkArg) => ThunkAction<Promise<Returned>, State, Extra, Action>,
    selector: (state: State) => ReducerValue<Returned>
) => {
    const useGet = (): ((arg?: ThunkArg) => Promise<Returned>) => {
        const dispatch = useDispatch<ThunkDispatch<State, Extra, Action>>();
        return useCallback((arg?: ThunkArg) => dispatch(thunk(arg)), []);
    };

    let queued = {
        state: false,
        id: queue.getId(),
    };

    const hookSelector = createSelector(selector, (result): [Returned | undefined, boolean] => {
        const { error, value } = result;

        if ((error !== undefined || value !== undefined) && queued.state) {
            // Reset the queued state when the thunk has resolved.
            queued.state = false;
        }

        if (error) {
            const thrownError = new Error(error.message);
            thrownError.name = error.name || thrownError.name;
            thrownError.stack = error.stack || thrownError.stack;
            throw thrownError;
        }

        if (queued.state && queue.getId() !== queued.id) {
            queued.state = false;
        }

        if (value === undefined && !queued.state) {
            queued.state = true;
            queue.enqueue(thunk);
        }

        const loading = value === undefined;
        return [value, loading];
    });

    const useValue = (): [Returned | undefined, boolean] => {
        return useSelector(hookSelector);
    };

    return {
        useGet,
        useValue,
    };
};
