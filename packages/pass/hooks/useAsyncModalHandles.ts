import { useCallback, useMemo, useRef, useState } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import type { MaybePromise } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { useRerender } from './useRerender';

export class AsyncModalAbortedError extends Error {}
type ModalState<T> = T & Omit<ModalProps, 'onSubmit'>;
type HookOptions<T> = { getInitialModalState: () => T };
export type UseAsyncModalHandle<V, T> = (options: UseAsyncModalHandlerOptions<V, T>) => Promise<void>;

type UseAsyncModalHandlerOptions<V, T> = Partial<T> & {
    onError?: (error: unknown) => MaybePromise<void>;
    onAbort?: () => MaybePromise<void>;
    onSubmit: (value: V) => MaybePromise<unknown>;
};

export const useAsyncModalHandles = <V, T = {}>(options: HookOptions<T>) => {
    const [key, next] = useRerender();
    const [state, setState] = useState<ModalState<T>>({
        ...options.getInitialModalState(),
        open: false,
    });
    const [loading, setLoading] = useState<boolean>(false);

    const resolver = useRef<(value: V) => void>(noop);
    const rejector = useRef<(error: unknown) => void>(noop);
    const resolve = useCallback((value: V) => resolver.current?.(value), []);

    const abort = useCallback(() => rejector.current?.(new AsyncModalAbortedError()), []);

    const handler = useCallback<UseAsyncModalHandle<V, T>>(
        async (opts) => {
            next();

            const { onSubmit, onError, onAbort, ...modalOptions } = opts;
            setState({ ...options.getInitialModalState(), ...modalOptions, open: true });
            setLoading(false);

            try {
                const value = await new Promise<V>((resolve, reject) => {
                    resolver.current = resolve;
                    rejector.current = reject;
                });

                setLoading(true);
                await onSubmit(value);
            } catch (error) {
                if (error instanceof AsyncModalAbortedError) await onAbort?.();
                else await onError?.(error);
            } finally {
                setState((state) => ({ ...state, open: false }));
                setLoading(false);
            }
        },
        [options.getInitialModalState]
    );

    return useMemo(
        () => ({ handler, abort, state, loading, resolver: resolve, key }),
        [handler, abort, state, loading, key]
    );
};
