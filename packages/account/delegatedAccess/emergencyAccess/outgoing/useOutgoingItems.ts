import { useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { type ContactEmailsState, contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import { type DelegatedAccessState } from '../../index';
import { listOutgoingDelegatedAccess } from '../../outgoingActions';
import { type EnrichedOutgoingDelegatedAccessReturnValue, selectEnrichedOutgoingDelegatedAccess } from './selector';

export interface OutgoingItemsResult {
    items: EnrichedOutgoingDelegatedAccessReturnValue['items'];
    loading: boolean;
}

type RequiredState = DelegatedAccessState & ContactEmailsState;

export const useOutgoingItems = (): OutgoingItemsResult => {
    const dispatch = baseUseDispatch<ThunkDispatch<RequiredState, ProtonThunkArguments, Action>>();
    const { items, loading } = baseUseSelector<RequiredState, EnrichedOutgoingDelegatedAccessReturnValue>(
        selectEnrichedOutgoingDelegatedAccess
    );

    useEffect(() => {
        Promise.all([dispatch(listOutgoingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

    return { items, loading };
};
