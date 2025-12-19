import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';

import type { ActionListener, ActionPayload } from './incoming/interface';
import { useIncomingItems } from './incoming/useIncomingItems';

export interface IncomingDelegatedAccessProviderValue {
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    items: ReturnType<typeof useIncomingItems>['items'];
    loading: boolean;
}

export const IncomingControllerContext = createContext<IncomingDelegatedAccessProviderValue>({} as any);

export const IncomingDelegatedAccessProvider = ({ children }: { children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const { items, loading } = useIncomingItems();

    const incomingController: IncomingDelegatedAccessProviderValue = {
        notify: useCallback((payload) => {
            return listenersRef.current?.notify(payload);
        }, []),
        subscribe: useCallback((cb) => {
            if (!listenersRef.current) {
                listenersRef.current = createListeners();
            }
            return listenersRef.current.subscribe(cb);
        }, []),
        items,
        loading,
    };

    return (
        <IncomingControllerContext.Provider value={incomingController}>{children}</IncomingControllerContext.Provider>
    );
};

export const useIncomingController = () => {
    return useContext(IncomingControllerContext);
};
