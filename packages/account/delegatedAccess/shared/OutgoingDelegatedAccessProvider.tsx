import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';

import type { ActionListener, ActionPayload } from './outgoing/interface';
import { useOutgoingItems } from './outgoing/useOutgoingItems';

export interface OutgoingDelegatedAccessProviderValue {
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    outgoingDelegatedAccess: ReturnType<typeof useOutgoingItems>;
}

export const OutgoingControllerContext = createContext<OutgoingDelegatedAccessProviderValue>({} as any);

export const OutgoingDelegatedAccessProvider = ({ children }: { children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const outgoingDelegatedAccess = useOutgoingItems();

    const outgoingController: OutgoingDelegatedAccessProviderValue = {
        notify: useCallback((payload) => {
            return listenersRef.current?.notify(payload).find((value) => !!value) ?? undefined;
        }, []),
        subscribe: useCallback((cb) => {
            if (!listenersRef.current) {
                listenersRef.current = createListeners();
            }
            return listenersRef.current.subscribe(cb);
        }, []),
        outgoingDelegatedAccess,
    };

    return (
        <OutgoingControllerContext.Provider value={outgoingController}>{children}</OutgoingControllerContext.Provider>
    );
};

export const useOutgoingController = () => {
    return useContext(OutgoingControllerContext);
};
