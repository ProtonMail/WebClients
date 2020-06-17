import { useState } from 'react';
import { useHandler } from 'react-components';
import { Handler, Abortable } from 'react-components/hooks/useHandler';

/**
 * Return the handler debounced but with pending flag indicating if there is a pending call or not
 */
export const useDebouncedHandler = <T extends Handler>(handler: T, debounce: number): [boolean, T & Abortable] => {
    const [pending, setPending] = useState(false);

    const debouncedHandler = useHandler(
        (...args: any[]) => {
            setPending(false);
            return handler(...args);
        },
        { debounce }
    );

    const resultHandler = (...args: any[]) => {
        setPending(true);
        return debouncedHandler(...args);
    };
    resultHandler.abort = debouncedHandler.abort;

    return [pending, resultHandler as T & Abortable];
};
