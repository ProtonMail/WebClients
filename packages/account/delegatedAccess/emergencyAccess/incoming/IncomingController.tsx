import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';

import { AccessIncomingEmergencyContactAction } from './AccessIncomingEmergencyContactAction';
import { DeleteIncomingEmergencyContactAction } from './DeleteIncomingEmergencyContactAction';
import { RequestAccessIncomingEmergencyContactAction } from './RequestAccessIncomingEmergencyContactAction';
import type { ActionListener, ActionPayload } from './interface';
import { useIncomingItems } from './useIncomingItems';

export interface IncomingController {
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    items: ReturnType<typeof useIncomingItems>['items'];
    loading: boolean;
}

export const IncomingControllerContext = createContext<IncomingController>({} as any);

export const IncomingControllerProvider = ({ app, children }: { app: APP_NAMES; children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const { items, loading } = useIncomingItems();

    const incomingController: IncomingController = {
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
        <IncomingControllerContext.Provider value={incomingController}>
            <DeleteIncomingEmergencyContactAction />
            <RequestAccessIncomingEmergencyContactAction />
            <AccessIncomingEmergencyContactAction app={app} />
            {children}
        </IncomingControllerContext.Provider>
    );
};

export const useIncomingController = () => {
    return useContext(IncomingControllerContext);
};
