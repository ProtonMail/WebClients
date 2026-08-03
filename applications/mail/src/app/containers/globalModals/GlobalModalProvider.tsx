import { useRef } from 'react';

import { GlobalBYOESpotlightModal } from './GlobalBYOESpotlightModal';
import { GlobalCategoriesB2BOnboarding } from './GlobalCategoriesB2BOnboarding';
import { GlobalCategoriesB2COnboarding } from './GlobalCategoriesB2COnboarding';
import { GlobalScheduleModal } from './GlobalScheduleModal';
import { GlobalSnoozeModal } from './GlobalSnoozeModal';
import { GlobalUnsubscribeModal } from './GlobalUnsubscribeModal';
import { GlobalModalContext } from './globalModalContext';
import type { ModalListener, ModalPayload } from './inteface';

export { useMailGlobalModals } from './globalModalContext';

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
            <GlobalCategoriesB2BOnboarding />
            <GlobalCategoriesB2COnboarding />
            <GlobalBYOESpotlightModal />
            {children}
        </GlobalModalContext.Provider>
    );
};
