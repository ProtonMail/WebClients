import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';

import { addressesThunk } from '../addresses';
import { userThunk } from '../user';
import {
    type AddressKeyCreationRequiredState,
    createAddressKeysThunk,
    getCreateAddressKeysPayload,
} from './createAddressKeys';

export const createSelfMissingAddressKeysThunk = (): ThunkAction<
    Promise<void>,
    AddressKeyCreationRequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const user = await dispatch(userThunk());

        if (
            // If signed in as subuser
            user.OrganizationPrivateKey ||
            // Keys setup does not happen here
            !user.Keys.length
        ) {
            return;
        }

        const addresses = await dispatch(addressesThunk());

        // Any enabled address without keys
        const addressesWithKeysToGenerate = addresses.filter(({ Status, Keys = [] }) => {
            return Status === ADDRESS_STATUS.STATUS_ENABLED && !Keys.length;
        });
        if (!addressesWithKeysToGenerate.length) {
            return;
        }
        const addressKeyCreationPayload = await dispatch(getCreateAddressKeysPayload());
        await dispatch(
            createAddressKeysThunk({
                addressKeyCreationPayload,
                addressesToGenerate: addressesWithKeysToGenerate,
            })
        );
    };
};
