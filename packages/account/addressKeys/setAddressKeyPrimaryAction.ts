import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import { getPrimaryAddressKeysForSigning, setPrimaryAddressKey } from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';

export const setAddressKeyPrimaryAction = ({
    address,
    addressKeyID,
}: {
    address: Address;
    addressKeyID: string;
}): ThunkAction<Promise<void>, UserKeysState & AddressKeysState & KtState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            const api = getSilentApi(extra.api);
            const [user, userKeys, addressKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressKeysThunk({ addressID: address.ID })),
            ]);

            const ktActivation = dispatch(getKTActivation());
            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                ktActivation,
                api,
                config: extra.config,
            });
            const [, newActiveKeys, formerActiveKeys] = await setPrimaryAddressKey({
                api,
                address,
                addressKeys,
                addressKeyID,
                keyTransparencyVerify,
            });
            await Promise.all([
                resignSKLWithPrimaryKey({
                    api,
                    ktActivation: dispatch(getKTActivation()),
                    address,
                    newPrimaryKeys: getPrimaryAddressKeysForSigning(newActiveKeys, true),
                    formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                    userKeys,
                }),
                keyTransparencyCommit(user, userKeys),
            ]);
            await dispatch(addressThunk({ address, cache: CacheType.None }));
        } finally {
            extra.eventManager.start();
        }
    };
};
