import { useRef, useEffect, RefObject, useMemo } from 'react';
import { useEventManager } from 'react-components';
import { debounce } from 'proton-shared/lib/helpers/function';

export type Handler = (arg?: any) => void;

/**
 * Create a stable reference of handler
 * But will always run the updated version of the handler in argument
 */
export const useHandler = (handler: Handler, options: { debounce?: number } = {}) => {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    const actualHandler = useMemo(() => {
        const handler = (arg?: any) => handlerRef.current(arg);

        if (options.debounce && options.debounce > 0) {
            return debounce(handler, options.debounce);
        }

        return handler;
    }, []);

    return actualHandler;
};

/**
 * Listen to the eventNane of the ref element
 * Use useHandler to ensure an updated version of the handler
 */
export const useEventListener = (ref: RefObject<Element | null | undefined>, eventName: string, handler: Handler) => {
    const actualHandler = useHandler(handler);

    useEffect(() => {
        ref.current?.addEventListener(eventName, actualHandler);
        return () => ref.current?.removeEventListener(eventName, actualHandler);
    }, []);
};

/**
 * Listen to the event manager
 * Use useHandler to ensure an updated version of the handler
 */
export const useSubscribeEventManager = (handler: Handler) => {
    const { subscribe } = useEventManager();

    const actualHandler = useHandler(handler);

    useEffect(() => subscribe(actualHandler), []);
};
