import { useRef, useState } from 'react';
import { useHandler } from 'react-components';
import { Handler, Abortable } from 'react-components/hooks/useHandler';

/**
 * Return the handler debounced but with additional features:
 * - pending flag indicating if there is a pending call or not
 * - pause and restart actions
 */
export const useDebouncedHandler = <T extends Handler>(handler: T, debounce: number) => {
    const [pending, setPending] = useState(false);
    const pauseFlag = useRef<boolean>(false);
    const lastCall = useRef<any[]>([]);

    const debouncedHandler = useHandler(
        (...args: any[]) => {
            setPending(false);
            return handler(...args);
        },
        { debounce }
    );

    const resultHandler = (...args: any[]) => {
        setPending(true);
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
        if (pending) {
            debouncedHandler(...lastCall.current);
        }
    };

    return { pending, pause, restart, handler: resultHandler as T & Abortable };
};
