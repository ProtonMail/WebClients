import { useRef } from 'react';
import { useHandler } from 'react-components';
import { Handler, Abortable } from 'react-components/hooks/useHandler';

/**
 * Return the handler debounced but with additional features:
 * - pending flag indicating if there is a pending call or not
 * - pause and restart actions
 */
export const useDebouncedHandler = <T extends Handler>(handler: T, debounce: number) => {
    const pending = useRef<boolean>(false);
    const pauseFlag = useRef<boolean>(false);
    const lastCall = useRef<any[]>([]);

    const debouncedHandler = useHandler(
        (...args: any[]) => {
            pending.current = false;
            return handler(...args);
        },
        { debounce }
    );

    const resultHandler = (...args: any[]) => {
        pending.current = true;
        lastCall.current = args;
        if (!pauseFlag.current) {
            return debouncedHandler(...args);
        }
    };
    resultHandler.abort = debouncedHandler.abort;

    const pause = () => {
        pauseFlag.current = true;
    };

    const restart = () => {
        pauseFlag.current = false;
        if (pending.current) {
            debouncedHandler(...lastCall.current);
        }
    };

    return { pending, pause, restart, handler: resultHandler as T & Abortable };
};
