/**
 * FIXME: split the responsibilities into 2 separate
 * building blocks that consumers can compose :
 * 1. a component for handling the modal
 * 2. a hook for handling the async resolver
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import noop from '@proton/utils/noop';

export class AsyncModalAbortedError extends Error {}

type ModalState<T> = T & Omit<ModalProps, 'onSubmit'>;
type HookOptions<T> = { getInitialModalState: () => T };
export type UseAsyncModalHandle<V, T> = (options: UseAsyncModalHandlerOptions<V, T>) => Promise<void>;

type UseAsyncModalHandlerOptions<V, T> = Partial<T> & {
    onError?: (error: unknown) => any | Promise<any>;
    onAbort?: () => any | Promise<any>;
    onSubmit: (value: V) => any | Promise<any>;
};

export const useAsyncModalHandles = <V, T>({ getInitialModalState }: HookOptions<T>) => {
    const getInitialState = useCallback(
        (): ModalState<T> => ({ ...getInitialModalState(), open: false, disabled: false }),
        [getInitialModalState]
    );
    const [state, setState] = useState<ModalState<T>>(getInitialState());

    const resolver = useRef<(value: V) => void>(noop);
    const rejector = useRef<(error: unknown) => void>(noop);
    const resolve = useCallback((value: V) => resolver.current?.(value), []);

    const abort = useCallback(() => {
        rejector.current?.(new AsyncModalAbortedError());
        setState(getInitialState());
    }, [getInitialState]);

    const handler = useCallback<UseAsyncModalHandle<V, T>>(
        async (opts) => {
            const { onSubmit, onError, onAbort, ...modalOptions } = opts;
            setState((state) => ({ ...state, ...modalOptions, open: true }));

            try {
                const value = await new Promise<V>((resolve, reject) => {
                    resolver.current = resolve;
                    rejector.current = reject;
                });

                setState((state) => ({ ...state, disabled: true }));
                await onSubmit(value);
            } catch (e) {
                setState((state) => ({ ...state, disabled: false }));

                if (e instanceof AsyncModalAbortedError) {
                    await onAbort?.();
                } else {
                    await onError?.(e);
                }
            } finally {
                setState({ ...getInitialState(), ...modalOptions });
            }
        },
        [getInitialState]
    );

    return useMemo(() => ({ handler, abort, state, resolver: resolve }), [handler, abort, state]);
};
