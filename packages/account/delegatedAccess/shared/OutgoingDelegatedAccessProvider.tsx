import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

import { useUser } from '../../user/hooks';
import { getIsOutgoingDelegatedAccessAvailable } from '../available';
import { maxOutgoingEmergencyContacts } from '../constants';
import type { ActionListener, ActionPayload } from './outgoing/interface';
import { useOutgoingItems } from './outgoing/useOutgoingItems';

export interface OutgoingDelegatedAccessProviderValue {
    items: ReturnType<typeof useOutgoingItems>['items'];
    loading: boolean;
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    meta: {
        available: boolean;
        emergencyContacts: {
            hasAccess: boolean;
            hasUpsell: boolean;
            hasReachedLimit: boolean;
            limit: number;
        };
        count: number;
    };
}

export const OutgoingControllerContext = createContext<OutgoingDelegatedAccessProviderValue>({} as any);

export const OutgoingDelegatedAccessProvider = ({ children }: { children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const { items, loading } = useOutgoingItems();
    const [user] = useUser();

    const outgoingDelegatedAccessCount = items.emergencyContacts.length + items.recoveryContacts.length;

    const hasEmergencyContactAccess = user.isPaid || /* Also checks pass lifetime + pass from sl */ hasPaidPass(user);

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
        meta: {
            available: getIsOutgoingDelegatedAccessAvailable(user),
            emergencyContacts: {
                hasAccess: hasEmergencyContactAccess,
                hasUpsell: user.canPay && !hasEmergencyContactAccess,
                hasReachedLimit: items.emergencyContacts.length === maxOutgoingEmergencyContacts,
                limit: maxOutgoingEmergencyContacts,
            },
            count: outgoingDelegatedAccessCount,
        },
        items,
        loading,
    };

    return (
        <OutgoingControllerContext.Provider value={outgoingController}>{children}</OutgoingControllerContext.Provider>
    );
};

export const useOutgoingController = () => {
    return useContext(OutgoingControllerContext);
};
