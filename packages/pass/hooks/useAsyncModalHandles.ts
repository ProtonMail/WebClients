import { useCallback, useMemo, useRef, useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import type { MaybePromise } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export class AsyncModalAbortedError extends Error {}
type ModalState<T> = T & Omit<ModalProps, 'onSubmit'> & { loading: boolean };
type HookOptions<T> = { getInitialModalState?: () => T };
export type UseAsyncModalHandle<V, T> = (options: UseAsyncModalHandlerOptions<V, T>) => Promise<void>;

type UseAsyncModalHandlerOptions<V, T> = Partial<T> & {
    onError?: (error: unknown) => MaybePromise<void>;
    onAbort?: () => MaybePromise<void>;
    onSubmit: (value: V) => MaybePromise<void>;
};

export const useAsyncModalHandles = <V, T = {}>(options?: HookOptions<T>) => {
    const getInitialState = useCallback(
        (): ModalState<T> => ({ ...(options?.getInitialModalState?.() ?? ({} as T)), open: false, loading: false }),
        [options?.getInitialModalState]
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
            setState((state) => ({ ...state, ...modalOptions, open: true, loading: false }));

            try {
                const value = await new Promise<V>((resolve, reject) => {
                    resolver.current = resolve;
                    rejector.current = reject;
                });

                setState((state) => ({ ...state, loading: true }));
                await onSubmit(value);
            } catch (error) {
                setState((state) => ({ ...state, loading: false }));

                if (error instanceof AsyncModalAbortedError) await onAbort?.();
                else await onError?.(error);
            } finally {
                setState({ ...getInitialState(), ...modalOptions });
            }
        },
        [getInitialState]
    );

    return useMemo(() => ({ handler, abort, state, resolver: resolve }), [handler, abort, state]);
};
