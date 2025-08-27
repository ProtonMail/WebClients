import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

import { useUser } from '../../../user/hooks';
import { maxOutgoingDelegatedAccessContacts } from '../../constants';
import { AddOutgoingEmergencyContactAction } from './AddOutgoingEmergencyContactAction';
import { DeleteOutgoingEmergencyContactAction } from './DeleteOutgoingEmergencyContactAction';
import { EditOutgoingEmergencyContactAction } from './EditOutgoingEmergencyContactAction';
import { GrantAccessOutgoingEmergencyContactAction } from './GrantAccessOutgoingEmergencyContactAction';
import { ResetAccessOutgoingEmergencyContactAction } from './ResetAccessOutgoingEmergencyContactAction';
import { UpsellOutgoingEmergencyContactAction } from './UpsellOutgoingEmergencyContactAction';
import { ViewAccessOutgoingEmergencyContactAction } from './ViewAccessOutgoingEmergencyContactAction';
import type { ActionListener, ActionPayload } from './interface';
import { useOutgoingItems } from './useOutgoingItems';

export interface OutgoingController {
    items: ReturnType<typeof useOutgoingItems>['items'];
    loading: boolean;
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    meta: {
        hasAccess: boolean;
        hasUpsell: boolean;
        hasReachedLimit: boolean;
        count: number;
    };
}

export const OutgoingControllerContext = createContext<OutgoingController>({} as any);

export const OutgoingControllerProvider = ({ app, children }: { app: APP_NAMES; children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const { items, loading } = useOutgoingItems();
    const [user] = useUser();

    const outgoingDelegatedAccessCount = items.length;
    const hasReachedLimit = outgoingDelegatedAccessCount === maxOutgoingDelegatedAccessContacts;

    const hasAccess = user.isPaid || /* Also checks pass lifetime + pass from sl */ hasPaidPass(user);

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
            hasAccess,
            hasUpsell: user.canPay && !hasAccess,
            hasReachedLimit,
            count: outgoingDelegatedAccessCount,
        },
        items,
        loading,
    };

    return (
        <OutgoingControllerContext.Provider value={outgoingController}>
            {outgoingController.meta.hasUpsell && <UpsellOutgoingEmergencyContactAction app={app} />}
            <AddOutgoingEmergencyContactAction />
            <EditOutgoingEmergencyContactAction />
            <DeleteOutgoingEmergencyContactAction />
            <ViewAccessOutgoingEmergencyContactAction />
            <GrantAccessOutgoingEmergencyContactAction />
            <ResetAccessOutgoingEmergencyContactAction />
            {children}
        </OutgoingControllerContext.Provider>
    );
};

export const useOutgoingController = () => {
    return useContext(OutgoingControllerContext);
};
