import { useCallback, useEffect } from 'react';

import { type Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces/Key';

import { selectAddresses } from '../addresses';
import { type AddressKeysState, addressKeysThunk, getAllAddressKeysAction, selectAddressKeys } from './index';

export const useGetAddressKeys = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<AddressKeysState, ProtonThunkArguments, Action>>();
    return useCallback((addressID: string) => dispatch(addressKeysThunk({ addressID })), [dispatch]);
};

type Result = { value: { address: Address; keys: DecryptedAddressKey[] }[] | undefined; loading: boolean };

const isSettled = (model: { value?: unknown; error?: unknown } | undefined) =>
    model?.value !== undefined || model?.error !== undefined;

const selector = createSelector(
    [(state: AddressKeysState) => selectAddresses(state), (state: AddressKeysState) => selectAddressKeys(state)],
    ({ value: addresses, error: addressesError }, addressKeys): Result => {
        // Done once every address has been decrypted or has failed, so consumers can rely on it
        // to know all keys (and the inactive keys they fill in) are known
        const loading =
            addresses === undefined
                ? addressesError === undefined
                : !addresses.every(({ ID }) => isSettled(addressKeys[ID]));
        // The value is available as soon as one address is decrypted
        const hasDecryptedKeys = !!addresses?.some(({ ID }) => addressKeys[ID]?.value !== undefined);
        return {
            value:
                !hasDecryptedKeys || !addresses
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
    const addresses = baseUseSelector((state: AddressKeysState) => selectAddresses(state).value);
    useEffect(() => {
        // Addresses added after mount (created here or in another client) get no keys from the listener,
        // which only recomputes addresses it already has keys for. Decrypted addresses are cached.
        dispatch(getAllAddressKeysAction());
    }, [addresses]);
    return [selectedValue.value, selectedValue.loading] as const;
};
