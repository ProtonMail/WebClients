import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import {
    baseUseDispatch as useDispatch,
    baseUseSelector as useSelector,
    baseUseStore as useStore,
} from '@proton/react-redux-store';

import type { ReducerValue } from './interface';

const createQueue = <T,>() => {
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

export type Queue = ReturnType<typeof createQueue>;
export const ModelQueueContext = createContext<Queue | null>(null);

export const ModelThunkDispatcher = ({ children }: { children: ReactNode }) => {
    const store = useStore();
    const state = useRef<Queue | null>(null);

    if (!state.current) {
        state.current = createQueue();
    }

    const queue = state.current;

    useEffect(() => {
        if (!queue) {
            return;
        }

        const dispatchAll = () => {
            queue.consume((thunk: any) => {
                store.dispatch(thunk());
            });
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
    }, [store, queue]);

    return <ModelQueueContext.Provider value={queue}>{children}</ModelQueueContext.Provider>;
};

export const createHooks = <State, Extra, Returned, ThunkArg = void>(
    thunk: (arg?: ThunkArg) => ThunkAction<Promise<Returned>, State, Extra, Action>,
    selector: (state: State) => ReducerValue<Returned>,
    options: { periodic: boolean } = { periodic: true }
) => {
    const useGet = (): ((arg?: ThunkArg) => Promise<Returned>) => {
        const dispatch = useDispatch<ThunkDispatch<State, Extra, Action>>();
        return useCallback((arg?: ThunkArg) => dispatch(thunk(arg)), []);
    };

    let queueRef: { state: boolean; queue: Queue | null; id: null | any; once: boolean } = {
        state: false,
        queue: null,
        id: null,
        // Should the hook trigger the thunk periodically. For now 'periodic' means once per page load.
        once: !options.periodic,
    };

    const hookSelector = createSelector(selector, (result): [Returned | undefined, boolean] => {
        if (!result) {
            return [undefined, true];
        }

        const { error, value } = result;

        if ((error !== undefined || value !== undefined) && queueRef.state) {
            // Reset the queued state when the thunk has resolved.
            queueRef.state = false;
        }

        if (error && value === undefined) {
            const thrownError = new Error(error.message);
            thrownError.name = error.name || thrownError.name;
            thrownError.stack = error.stack || thrownError.stack;
            throw thrownError;
        }

        if (queueRef.state && queueRef.queue?.getId() !== queueRef.id) {
            queueRef.state = false;
        }

        if ((value === undefined || !queueRef.once) && !queueRef.state && queueRef.queue) {
            queueRef.state = true;
            queueRef.once = true;
            queueRef.queue.enqueue(thunk);
        }

        const loading = value === undefined;
        return [value, loading];
    });

    const useValue = (): [Returned | undefined, boolean] => {
        queueRef.queue = useContext(ModelQueueContext);
        return useSelector(hookSelector);
    };

    return {
        useGet,
        useValue,
    };
};
