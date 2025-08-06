import { createContext, useContext, useRef } from 'react';

import { GlobalScheduleModal } from './GlobalScheduleModal';
import { GlobalSnoozeModal } from './GlobalSnoozeModal';
import { GlobalUnsubscribeModal } from './GlobalUnsubscribeModal';
import type { GlobalModal, ModalListener, ModalPayload } from './inteface';

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
            <GlobalScheduleModal />
            <GlobalSnoozeModal />
            <GlobalUnsubscribeModal />
            {children}
        </GlobalModalContext.Provider>
    );
};

export const useMailGlobalModals = () => {
    const context = useContext(GlobalModalContext);
    if (!context) {
        throw new Error('useGlobalModal must be used within a GlobalModalProvider');
    }

    return context;
};
