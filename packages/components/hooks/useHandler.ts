import type { DependencyList, RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import useEventManager from '@proton/components/hooks/useEventManager';
import debounce from '@proton/utils/debounce';
import throttle from '@proton/utils/throttle';

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

/**
 * Listen to the event manager
 * Use useHandler to ensure an updated version of the handler
 */
export const useSubscribeEventManager = (handler: Handler) => {
    const { subscribe } = useEventManager();

    const actualHandler = useHandler(handler);

    useEffect(() => {
        const unsubscribe = subscribe(actualHandler);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);
};

/**
 * Run a handler at a defined interval
 * Returns a function to abort the interval before the component is unmount
 * Using an interval 0 will prevent the interval to be used
 */
export const useInterval = (interval: number, handler: Handler) => {
    const actualHandler: Handler & Cancellable = useHandler(handler);

    useEffect(() => {
        if (interval > 0) {
            const intervalID = window.setInterval(actualHandler, interval);

            actualHandler();

            actualHandler.cancel = () => clearInterval(intervalID);

            return actualHandler.cancel;
        }
    }, []);

    return () => actualHandler.cancel?.();
};

export default useHandler;
