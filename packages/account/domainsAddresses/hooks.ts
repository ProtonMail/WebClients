import { useCallback, useEffect } from 'react';

import { Action, ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store/sharedContext';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { DomainAddressesState, domainAddressesThunk, selectDomainAddresses } from './index';

export const useGetDomainAddresses = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<DomainAddressesState, ProtonThunkArguments, Action>>();
    return useCallback((addressID: string) => dispatch(domainAddressesThunk({ thunkArg: addressID })), [dispatch]);
};

interface Result {
    value: {
        [key: string]: DomainAddress[] | undefined;
    };
    loading: boolean;
}

const selector = createSelector([(state: DomainAddressesState) => selectDomainAddresses(state)], (state): Result => {
    const entries = Object.entries(state);
    const loading = entries.some(([, entry]) => !entry?.value && !entry?.error);
    return {
        value: Object.fromEntries(entries.map(([key, entry]) => [key, entry?.value])),
        loading,
    };
});

export const useDomainsAddresses = (domains: Domain[] | undefined) => {
    const getDomainAddresses = useGetDomainAddresses();
    const selectedValue = baseUseSelector<DomainAddressesState, Result>(selector);
    useEffect(() => {
        if (!domains) {
            return;
        }
        domains.forEach((domain) => {
            getDomainAddresses(domain.ID);
        });
    }, [domains]);
    return [selectedValue.value, selectedValue.loading] as const;
};
