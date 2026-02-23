import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address, KeyGenConfig, KeyGenConfigV6 } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressThunk, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

export const addAddressKeyAction = ({
    keyGenConfig,
    address,
}: {
    keyGenConfig: KeyGenConfig | KeyGenConfigV6;
    address: Address;
}): ThunkAction<
    Promise<{ fingerprint: string }>,
    UserKeysState & AddressKeysState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            const api = getSilentApi(extra.api);
            const [user, userKeys, addresses, addressKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
                dispatch(addressKeysThunk({ addressID: address.ID })),
            ]);

            const ktActivation = dispatch(getKTActivation());
            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                ktActivation,
                api,
                config: extra.config,
            });
            const [newKey, updatedActiveKeys, formerActiveKeys] = await addAddressKeysProcess({
                api,
                userKeys,
                keyGenConfig,
                addresses,
                address,
                addressKeys: addressKeys,
                keyPassword: extra.authentication.getPassword(),
                keyTransparencyVerify,
            });
            await Promise.all([
                resignSKLWithPrimaryKey({
                    api,
                    ktActivation,
                    address,
                    newPrimaryKeys: getPrimaryAddressKeysForSigning(updatedActiveKeys, true),
                    formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                    userKeys,
                }),
                keyTransparencyCommit(user, userKeys),
            ]);
            await dispatch(addressThunk({ address, cache: CacheType.None }));
            return { fingerprint: newKey.fingerprint };
        } finally {
            extra.eventManager.start();
        }
    };
};
