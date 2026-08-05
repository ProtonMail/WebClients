import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { activateMemberAddressKeys, getAddressesWithKeysToActivate } from '@proton/shared/lib/keys';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressKeysState, addressKeysThunk } from './index';

type RequiredState = KtState & UserState & AddressesState & AddressKeysState & UserKeysState;

export const activateMemberAddressKeysThunk = (): ThunkAction<
    Promise<void>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, addresses, userKeys] = await Promise.all([
            dispatch(userThunk()),
            dispatch(addressesThunk()),
            dispatch(userKeysThunk()),
        ]);

        const addressesWithKeysToActivate = getAddressesWithKeysToActivate(user, addresses);

        if (!addressesWithKeysToActivate.length) {
            return;
        }

        const keyPassword = extra.authentication.getPassword();
        const silentApi = getSilentApi(extra.api);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api: silentApi,
            config: extra.config,
        });

        await Promise.all(
            addressesWithKeysToActivate.map(async (address) => {
                const addressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));
                return activateMemberAddressKeys({
                    address,
                    addresses,
                    addressKeys,
                    userKeys,
                    keyPassword,
                    api: silentApi,
                    keyTransparencyVerify,
                });
            })
        );
        await keyTransparencyCommit(user, userKeys);
        // Refetch all the addresses to get the updated key for the address
        await dispatch(addressesThunk({ cache: CacheType.None }));
    };
};
