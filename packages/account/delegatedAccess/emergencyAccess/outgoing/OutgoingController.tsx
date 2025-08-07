import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';

import { maxOutgoingDelegatedAccessContacts } from '../../constants';
import { AddOutgoingEmergencyContactAction } from './AddOutgoingEmergencyContactAction';
import { DeleteOutgoingEmergencyContactAction } from './DeleteOutgoingEmergencyContactAction';
import { EditOutgoingEmergencyContactAction } from './EditOutgoingEmergencyContactAction';
import { GrantAccessOutgoingEmergencyContactAction } from './GrantAccessOutgoingEmergencyContactAction';
import type { ActionListener, ActionPayload } from './interface';
import { useOutgoingItems } from './useOutgoingItems';

export interface OutgoingController {
    items: ReturnType<typeof useOutgoingItems>['items'];
    loading: boolean;
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    meta: {
        hasReachedLimit: boolean;
        count: number;
    };
}

export const OutgoingControllerContext = createContext<OutgoingController>({} as any);

export const OutgoingControllerProvider = ({ children }: { children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const { items, loading } = useOutgoingItems();

    const outgoingDelegatedAccessCount = items.length;
    const hasReachedLimit = outgoingDelegatedAccessCount === maxOutgoingDelegatedAccessContacts;

    const outgoingController: OutgoingController = {
        notify: useCallback((payload) => {
            return listenersRef.current?.notify(payload).find((value) => !!value) ?? undefined;
        }, []),
        subscribe: useCallback((cb) => {
            if (!listenersRef.current) {
                listenersRef.current = createListeners();
            }
            return listenersRef.current.subscribe(cb);
        }, []),
        meta: {
            hasReachedLimit,
            count: outgoingDelegatedAccessCount,
        },
        items,
        loading,
    };

    return (
        <OutgoingControllerContext.Provider value={outgoingController}>
            <AddOutgoingEmergencyContactAction />
            <EditOutgoingEmergencyContactAction />
            <DeleteOutgoingEmergencyContactAction />
            <GrantAccessOutgoingEmergencyContactAction />
            {children}
        </OutgoingControllerContext.Provider>
    );
};

export const useOutgoingController = () => {
    return useContext(OutgoingControllerContext);
};
