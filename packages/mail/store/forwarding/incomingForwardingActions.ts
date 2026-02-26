import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { addressKeysThunk } from '@proton/account/addressKeys';
import { type AddressesState, addressThunk } from '@proton/account/addresses';
import { replaceSelfAddressTokensIfNeeded } from '@proton/account/addresses/replaceAddressToken';
import type { KtState } from '@proton/account/kt';
import { getKTActivation, getKTUserContext } from '@proton/account/kt/actions';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import { userThunk } from '@proton/account/user';
import { type UserKeysState, userKeysThunk } from '@proton/account/userKeys';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { deleteForwarding as deleteForwardingConfig, rejectForwarding } from '@proton/shared/lib/api/forwardings';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { acceptIncomingForwarding } from '@proton/shared/lib/keys/forward/acceptIncomingForwarding';

import { getIncomingAddressForwarding, incomingAddressForwardingsActions } from './incoming';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

export const incomingForwardingThunk = ({
    forward,
}: {
    forward: IncomingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const result = await getIncomingAddressForwarding(extra.api, forward.ID);
        dispatch(incomingAddressForwardingsActions.upsertForwarding(result));
    };
};

export const acceptForwarding = ({
    address,
    forward,
}: {
    address: Address;
    forward: IncomingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        await dispatch(replaceSelfAddressTokensIfNeeded());

        const [user, userKeys, addressKeys] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressKeysThunk({ addressID: address.ID })),
        ]);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        await acceptIncomingForwarding({
            api,
            user,
            userKeys,
            addressKeys,
            address,
            forward,
            keyTransparencyVerify,
            keyTransparencyCommit,
            ktUserContext: await dispatch(getKTUserContext()),
        });
        await Promise.all([
            dispatch(addressThunk({ address, cache: CacheType.None })),
            dispatch(incomingForwardingThunk({ forward })),
        ]);
    };
};

export const declineForwarding = ({
    forward,
}: {
    forward: IncomingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(rejectForwarding(forward.ID));
        dispatch(incomingAddressForwardingsActions.deleteForwarding(forward));
    };
};

export const deleteForwarding = ({
    forward,
}: {
    forward: IncomingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteForwardingConfig(forward.ID));
        dispatch(incomingAddressForwardingsActions.deleteForwarding(forward));
    };
};
