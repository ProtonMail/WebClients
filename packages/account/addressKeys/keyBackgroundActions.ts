import { serverTime, wasServerTimeEverUpdated } from '@protontech/crypto';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { APPS } from '@proton/shared/lib/constants';
import { captureMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import type { AddressesState } from '../addresses';
import type { KtState } from '../kt';
import type { MemberState } from '../member';
import type { MembersState } from '../members';
import type { OrganizationState } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import type { ProtonDomainsState } from '../protonDomains';
import type { UserState } from '../user';
import type { UserInvitationsState } from '../userInvitations';
import type { UserKeysState } from '../userKeys';
import type { UserSettingsState } from '../userSettings';
import { activateMemberAddressKeysThunk } from './activateMemberAddressKeys';
import { activeKeysCheckThunk } from './activeKeysCheck';
import { createSelfMissingAddressKeysThunk } from './createSelfMissingAddressKeys';
import { migrateKeysThunk } from './migrateKeys';

export const runKeyBackgroundManager = (): ThunkAction<
    Promise<void>,
    KtState &
        UserState &
        OrganizationState &
        OrganizationKeyState &
        AddressesState &
        UserKeysState &
        ProtonDomainsState &
        UserSettingsState &
        UserInvitationsState &
        MemberState &
        MembersState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (extra.config.APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return;
        }
        try {
            await dispatch(activateMemberAddressKeysThunk()).catch(noop);
            await dispatch(createSelfMissingAddressKeysThunk()).catch(noop);

            await dispatch(migrateKeysThunk()).catch((e) => {
                const error = getSentryError(e);
                if (error) {
                    captureMessage('Key migration error', {
                        extra: { error, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
                    });
                }
            });

            await dispatch(activeKeysCheckThunk());
        } catch {}
    };
};
