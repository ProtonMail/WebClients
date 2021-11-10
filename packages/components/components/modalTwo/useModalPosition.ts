import { useLayoutEffect, useState } from 'react';

const listeners: (() => void)[] = [];

const notify = () => {
    listeners.forEach((listener) => {
        listener();
    });
};

export const subscribe = (listener: () => void) => {
    listeners.push(listener);
    return () => {
        listeners.splice(listeners.indexOf(listener), 1);
    };
};

export const getModalsLength = () => listeners.length - 1; // Subtract 1 to remove the persistent backdrop listener

const useModalPosition = (open: boolean) => {
    const [state, setState] = useState({ first: false, last: false });

    useLayoutEffect(() => {
        if (!open) {
            return;
        }
        const sync = () => {
            setState({ first: listeners[0] === sync, last: listeners[listeners.length - 1] === sync });
        };
        const unsubscribe = subscribe(sync);
        notify();
        return () => {
            unsubscribe();
            notify();
        };
    }, [open]);

    return state;
};

export default useModalPosition;
