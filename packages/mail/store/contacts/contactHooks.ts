import { useCallback, useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';

import { type ContactState, contactThunk, selectContact } from './contactSlice';

export const useGetContact = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<ContactState, ProtonThunkArguments, Action>>();
    return useCallback((contactID: string) => dispatch(contactThunk({ contactID })), [dispatch]);
};

type Result = { value: Contact | undefined; loading: boolean };

const selector = createSelector(
    [(state: ContactState) => selectContact(state), (_, id: string | undefined) => id],
    (contactState, id): Result => {
        const contact = contactState[id || ''];
        if (!contact) {
            return { value: undefined, loading: false };
        }
        return {
            value: contact.value,
            loading: !contact.value,
        };
    }
);

export const useContact = (contactID?: string) => {
    const dispatch = baseUseDispatch<ThunkDispatch<ContactState, ProtonThunkArguments, Action>>();
    const selectedValue = baseUseSelector<ContactState, Result>((state) => selector(state, contactID));
    useEffect(() => {
        if (!contactID) {
            return;
        }
        dispatch(contactThunk({ contactID }));
    }, [contactID]);
    return [selectedValue.value, selectedValue.loading] as const;
};
