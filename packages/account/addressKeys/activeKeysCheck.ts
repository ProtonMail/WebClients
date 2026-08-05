import { serverTime, wasServerTimeEverUpdated } from '@protontech/crypto';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { captureMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import { hasActiveKeysMismatch, updateActiveKeys } from '@proton/shared/lib/keys';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import type { MemberState } from '../member';
import type { OrganizationKeyState } from '../organizationKey';
import type { ProtonDomainsState } from '../protonDomains';
import { type UserState, userThunk } from '../user';
import type { UserInvitationsState } from '../userInvitations';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import type { UserSettingsState } from '../userSettings';
import { addressKeysThunk } from './index';

export const activeKeysCheckThunk = (): ThunkAction<
    Promise<void>,
    KtState &
        UserState &
        OrganizationKeyState &
        AddressesState &
        UserKeysState &
        ProtonDomainsState &
        UserSettingsState &
        UserInvitationsState &
        MemberState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const runActiveKeysCheckFlag = extra.unleashClient.isEnabled('CryptoDisableUndecryptableKeys');
        if (!runActiveKeysCheckFlag) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api: silentApi,
            config: extra.config,
        });
        try {
            const addresses = await dispatch(addressesThunk());
            const updatesHappened = await Promise.all(
                addresses.map(async (address) => {
                    const addressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));
                    if (!hasActiveKeysMismatch(address, addressKeys)) {
                        return false;
                    }
                    await updateActiveKeys(silentApi, address, addressKeys, keyTransparencyVerify);
                    return true;
                })
            );
            if (updatesHappened.some(Boolean)) {
                const user = await dispatch(userThunk());
                const userKeys = await dispatch(userKeysThunk());
                await keyTransparencyCommit(user, userKeys);
            }
        } catch (error) {
            const sentryError = getSentryError(error);
            if (sentryError) {
                captureMessage('Active keys check or update failed', {
                    extra: { sentryError, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
                });
            }
            throw error;
        }
    };
};
