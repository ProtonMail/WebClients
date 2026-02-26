import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { getKTActivation } from '@proton/account/kt/actions';
import { userThunk } from '@proton/account/user';
import { userKeysThunk } from '@proton/account/userKeys';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import { type ImportKeyData, type ReactivateKeysResult, importKeysProcess } from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys/index';
import { addressThunk, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import type { OrganizationKeyState } from '../organizationKey';

export const importKeysThunk = ({
    importKeyData,
    address,
}: {
    importKeyData: ImportKeyData[];
    address: Address;
}): ThunkAction<
    Promise<ReactivateKeysResult>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        try {
            const [user, userKeys, addresses, addressKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
                dispatch(addressKeysThunk({ addressID: address.ID })),
            ]);
            extra.eventManager.stop();
            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                ktActivation: dispatch(getKTActivation()),
                api,
                config: extra.config,
            });
            const result = await importKeysProcess({
                api,
                address,
                addressKeys: addressKeys,
                addresses,
                userKeys,
                keyImportRecords: importKeyData,
                keyPassword: extra.authentication.getPassword(),
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(user, userKeys);
            await dispatch(addressThunk({ address, cache: CacheType.None }));
            return result;
        } finally {
            extra.eventManager.start();
        }
    };
};
