import { useEffect } from 'react';

import { type Action, type ThunkDispatch } from '@reduxjs/toolkit';

import { type ContactEmailsState, contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import { listIncomingDelegatedAccess } from '../../incomingActions';
import { type DelegatedAccessState } from '../../index';
import { type EnrichedIncomingDelegatedAccessReturnValue, selectEnrichedIncomingDelegatedAccess } from './selector';

export interface IncomingItemsResult {
    items: EnrichedIncomingDelegatedAccessReturnValue['items'];
    loading: boolean;
}

type RequiredState = DelegatedAccessState & ContactEmailsState;

export const useIncomingItems = (): IncomingItemsResult => {
    const dispatch = baseUseDispatch<ThunkDispatch<RequiredState, ProtonThunkArguments, Action>>();
    const { items, loading } = baseUseSelector<RequiredState, EnrichedIncomingDelegatedAccessReturnValue>(
        selectEnrichedIncomingDelegatedAccess
    );

    useEffect(() => {
        Promise.all([dispatch(listIncomingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

    return { items, loading };
};
