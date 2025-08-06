import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { type ContactEmailsState, contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';
import noop from '@proton/utils/noop';

import { maxOutgoingDelegatedAccessContacts } from '../../constants';
import { type DelegatedAccessState } from '../../index';
import { listOutgoingDelegatedAccess } from '../../outgoingActions';
import { AddOutgoingEmergencyContactAction } from './AddOutgoingEmergencyContactAction';
import { DeleteOutgoingEmergencyContactAction } from './DeleteOutgoingEmergencyContactAction';
import { EditOutgoingEmergencyContactAction } from './EditOutgoingEmergencyContactAction';
import { GrantAccessOutgoingEmergencyContactAction } from './GrantAccessOutgoingEmergencyContactAction';
import type { ActionListener, ActionPayload } from './interface';
import { type EnrichedOutgoingDelegatedAccessReturnValue, selectEnrichedOutgoingDelegatedAccess } from './selector';

export interface OutgoingController {
    items: EnrichedOutgoingDelegatedAccessReturnValue['items'];
    loading: boolean;
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    meta: {
        hasReachedLimit: boolean;
        count: number;
    };
}

export const OutgoingControllerContext = createContext<OutgoingController>({} as any);

type RequiredState = DelegatedAccessState & ContactEmailsState;

export const OutgoingControllerProvider = ({ children }: { children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const dispatch = baseUseDispatch<ThunkDispatch<RequiredState, ProtonThunkArguments, Action>>();
    const { items, loading } = baseUseSelector<RequiredState, EnrichedOutgoingDelegatedAccessReturnValue>(
        selectEnrichedOutgoingDelegatedAccess
    );

    useEffect(() => {
        Promise.all([dispatch(listOutgoingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

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
