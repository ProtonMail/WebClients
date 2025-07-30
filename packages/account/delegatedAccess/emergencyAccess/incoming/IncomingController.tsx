import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from 'react';

import { type Action, type ThunkDispatch } from '@reduxjs/toolkit';

import { type ContactEmailsState, contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import createListeners, { type Listeners } from '@proton/shared/lib/helpers/listeners';
import noop from '@proton/utils/noop';

import { listIncomingDelegatedAccess } from '../../incomingActions';
import { type DelegatedAccessState } from '../../index';
import { AccessIncomingEmergencyContactAction } from './AccessIncomingEmergencyContactAction';
import { DeleteIncomingEmergencyContactAction } from './DeleteIncomingEmergencyContactAction';
import { RequestAccessIncomingEmergencyContactAction } from './RequestAccessIncomingEmergencyContactAction';
import type { ActionListener, ActionPayload } from './interface';
import { type EnrichedIncomingDelegatedAccessReturnValue, selectEnrichedIncomingDelegatedAccess } from './selector';

export interface IncomingController {
    notify: (payload: ActionPayload) => void;
    subscribe: (cb: ActionListener) => void;
    items: EnrichedIncomingDelegatedAccessReturnValue['items'];
    loading: boolean;
}

export const IncomingControllerContext = createContext<IncomingController>({} as any);
type RequiredState = DelegatedAccessState & ContactEmailsState;

export const IncomingControllerProvider = ({ app, children }: { app: APP_NAMES; children: ReactNode }) => {
    const listenersRef = useRef<Listeners<[ActionPayload], undefined> | null>(null);
    const dispatch = baseUseDispatch<ThunkDispatch<RequiredState, ProtonThunkArguments, Action>>();
    const { items, loading } = baseUseSelector<RequiredState, EnrichedIncomingDelegatedAccessReturnValue>(
        selectEnrichedIncomingDelegatedAccess
    );

    useEffect(() => {
        Promise.all([dispatch(listIncomingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

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
