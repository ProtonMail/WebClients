import type { DependencyList, RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

export type Handler = (...args: any[]) => void;

export interface Cancellable {
    cancel?: () => void;
}

/**
 * Create a stable reference of handler
 * But will always run the updated version of the handler in argument
 */
export const useHandler = <T extends Handler>(
    handler: T,
    options: { debounce?: number; throttle?: number } = {}
): T & Cancellable => {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    const actualHandler = useMemo(() => {
        const handler = (...args: any[]) => handlerRef.current(...args);

        if (options.debounce && options.debounce > 0) {
            return debounce(handler, options.debounce);
        }

        if (options.throttle && options.throttle > 0) {
            return throttle(handler, options.throttle);
        }

        return handler;
    }, []) as T & Cancellable;

    return actualHandler;
};

/**
 * Listen to the eventName of the ref element
 * Use useHandler to ensure an updated version of the handler
 */
export const useEventListener = (
    ref: RefObject<Document | Element | null | undefined>,
    eventName: string,
    handler: Handler,
    dependencies: DependencyList
) => {
    const actualHandler = useHandler(handler);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        el.addEventListener(eventName, actualHandler);
        return () => {
            el.removeEventListener(eventName, actualHandler);
        };
    }, dependencies);
};
