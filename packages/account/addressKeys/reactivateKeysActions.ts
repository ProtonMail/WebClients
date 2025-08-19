import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    type KeyReactivationRecord,
    type OnKeyReactivationCallback,
    reactivateKeysProcess,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { type AddressKeysState } from '../addressKeys/index';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';

export const reactivateKeysThunk = ({
    keyReactivationRecords,
    onReactivation,
}: {
    keyReactivationRecords: KeyReactivationRecord[];
    onReactivation: OnKeyReactivationCallback;
}): ThunkAction<
    Promise<void>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            const api = getSilentApi(extra.api);

            const [user, userKeys, addresses] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
            ]);
            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                ktActivation: dispatch(getKTActivation()),
                api,
                config: extra.config,
            });

            await reactivateKeysProcess({
                api,
                user,
                userKeys,
                addresses,
                keyReactivationRecords,
                keyPassword: extra.authentication.getPassword(),
                onReactivation,
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(user, userKeys).catch(noop);
            await Promise.all([
                dispatch(userThunk({ cache: CacheType.None })),
                dispatch(addressesThunk({ cache: CacheType.None })),
                dispatch(organizationKeyThunk({ cache: CacheType.None })), // Organization key potentially affected
            ]);
        } finally {
            extra.eventManager.start();
        }
    };
};
