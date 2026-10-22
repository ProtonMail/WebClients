import { useEffect } from 'react';

import type { Cancellable, Handler } from '@proton/hooks/useHandler';
import { useHandler } from '@proton/hooks/useHandler';

import useEventManager from './useEventManager';

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
