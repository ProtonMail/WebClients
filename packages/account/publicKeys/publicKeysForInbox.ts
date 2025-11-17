import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { MINUTE } from '@proton/shared/lib/constants';
import type { ApiKeysConfig } from '@proton/shared/lib/interfaces';
import type { GetPublicKeysForInbox } from '@proton/shared/lib/interfaces/hooks/GetPublicKeysForInbox';
import { type Record, getPromiseValue } from '@proton/shared/lib/models/cache';

import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import type { UserState } from '../user';
import type { UserKeysState } from '../userKeys';

const DEFAULT_LIFETIME = 30 * MINUTE;

const cache = new Map<string, Record<ApiKeysConfig>>();

/**
 * Get public keys valid in the context of Inbox apps.
 * In particular, internal address keys from external accounts are not returned.
 */
export const getPublicKeysForInboxThunk = ({
    email,
    lifetime = DEFAULT_LIFETIME,
    internalKeysOnly,
    includeInternalKeysWithE2EEDisabledForMail,
}: Parameters<GetPublicKeysForInbox>[0]): ThunkAction<
    ReturnType<GetPublicKeysForInbox>,
    KtState & UserState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const { api } = extra;
        const ktUserContext = await dispatch(getKTUserContext());
        const miss = () =>
            getPublicKeysEmailHelper({
                email,
                internalKeysOnly,
                includeInternalKeysWithE2EEDisabledForMail,
                api,
                ktUserContext,
                silence: true,
                noCache: lifetime === 0,
            });
        const cacheEntryID = `${email},${ktUserContext.ktActivation},${internalKeysOnly},${includeInternalKeysWithE2EEDisabledForMail}`;
        return getPromiseValue(cache, cacheEntryID, miss, lifetime);
    };
};
