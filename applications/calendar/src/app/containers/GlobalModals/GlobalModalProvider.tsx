import { createContext, useContext, useRef } from 'react';

import { GlobalBookingSuccess } from './GlobalBookingSuccess';
import type { GlobalModal, ModalListener, ModalPayload } from './interface';

export const GlobalModalContext = createContext<GlobalModal | undefined>(undefined);

function createSubscribable<T>() {
    const subscribers: Set<(message: T) => void> = new Set();

    return {
        subscribe(cb: (message: T) => void): () => void {
            subscribers.add(cb);
            return () => subscribers.delete(cb);
        },

        notify(message: T): void {
            subscribers.forEach((cb) => cb(message));
        },
    };
}

export const GlobalModalProvider = ({ children }: { children: React.ReactNode }) => {
    const listenersRef = useRef(createSubscribable<ModalPayload>());

    const notify = (payload: ModalPayload) => {
        return listenersRef.current?.notify(payload);
    };

    const subscribe = (cb: ModalListener) => {
        return listenersRef.current.subscribe(cb);
    };

    return (
        <GlobalModalContext.Provider value={{ notify, subscribe }}>
            {children}
            <GlobalBookingSuccess />
        </GlobalModalContext.Provider>
    );
};

export const useCalendarGlobalModals = () => {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useCalendarGlobalModals must be used within a GlobalModalProvider');
    }

    return context;
};
