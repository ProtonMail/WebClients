import { useCallback } from 'react';

import { type Action, type ThunkDispatch } from '@reduxjs/toolkit';

import { type AddressKeysState, dispatchGetAllAddressesKeys } from '@proton/account';
import { baseUseDispatch } from '@proton/react-redux-store';
import { type ProtonThunkArguments } from '@proton/redux-shared-store-types';

export const useGetAllAddressesKeys = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<AddressKeysState, ProtonThunkArguments, Action>>();
    return useCallback(() => dispatchGetAllAddressesKeys(dispatch), [dispatch]);
};
