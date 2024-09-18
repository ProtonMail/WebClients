import { useCallback, useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import { selectAddresses } from '../addresses';
import { type AddressKeysState, addressKeysThunk, getAllAddressKeysAction, selectAddressKeys } from './index';

export const useGetAddressKeys = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<AddressKeysState, ProtonThunkArguments, Action>>();
    return useCallback((addressID: string) => dispatch(addressKeysThunk({ addressID })), [dispatch]);
};

type Result = { value: { address: Address; keys: DecryptedAddressKey[] }[] | undefined; loading: boolean };

const selector = createSelector(
    [(state: AddressKeysState) => selectAddresses(state).value, (state: AddressKeysState) => selectAddressKeys(state)],
    (addresses, addressKeys): Result => {
        const loading =
            addresses === undefined ||
            Object.keys(addressKeys).length === 0 ||
            addresses.every(({ ID }) => addressKeys[ID]?.value === undefined);
        return {
            value:
                loading || !addresses
                    ? undefined
                    : addresses.map((address) => {
                          return {
                              address,
                              keys: addressKeys[address.ID]?.value || [],
                          };
                      }),
            loading,
        };
    }
);

export const useAddressesKeys = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<AddressKeysState, ProtonThunkArguments, Action>>();
    const selectedValue = baseUseSelector<AddressKeysState, Result>(selector);
    useEffect(() => {
        dispatch(getAllAddressKeysAction());
    }, []);
    return [selectedValue.value, selectedValue.loading] as const;
};
