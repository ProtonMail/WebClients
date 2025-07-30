import { type UnknownAction, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { type CacheType, cacheHelper, createPromiseStore, previousSelector } from '@proton/redux-utilities';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { User } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { isSelf } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import { type UserState, userThunk } from '../user';
import { getDecryptedDelegatedAccessToken } from './crypto';
import { type DelegatedAccessState, delegatedAccessActions, selectIncomingDelegatedAccess } from './index';
import type { IncomingDelegatedAccessOutput } from './interface';

const queryListIncomingDelegatedAccess = () => ({
    url: `account/v1/access/incoming`,
    method: 'get',
});

const canFetch = (user: User) => isSelf(user);

const promiseStore = createPromiseStore<IncomingDelegatedAccessOutput[]>();

const previous = previousSelector(selectIncomingDelegatedAccess);

export const listIncomingDelegatedAccess = (options?: {
    cache?: CacheType;
}): ThunkAction<
    Promise<IncomingDelegatedAccessOutput[]>,
    DelegatedAccessState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            if (!canFetch(user)) {
                return [];
            }
            const result = await extraArgument.api<{
                DelegatedAccesses: IncomingDelegatedAccessOutput[];
            }>(queryListIncomingDelegatedAccess());
            return result.DelegatedAccesses;
        };
        const cb = async () => {
            try {
                dispatch(delegatedAccessActions.pendingIncomingList());
                const payload = await getPayload();
                dispatch(delegatedAccessActions.fulfillIncomingList(payload));
                return payload;
            } catch (error) {
                dispatch(delegatedAccessActions.rejectIncomingList(miniSerializeError(error)));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
    };
};

const deleteDelegatedAccess = (id: string) => ({
    url: `account/v1/access/${id}/delete`,
    method: 'put',
});

export const deleteDelegatedAccessThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<
    Promise<void>,
    KtState & UserState & AddressesState & AddressKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteDelegatedAccess(id));
        dispatch(delegatedAccessActions.deleteIncomingItem({ DelegatedAccessID: id }));
    };
};

const requestDelegatedAccess = (id: string) => ({
    url: `account/v1/access/${id}/trigger`,
    method: 'put',
});

export const requestDelegatedAccessThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<
    Promise<IncomingDelegatedAccessOutput>,
    KtState & UserState & AddressesState & AddressKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const { IncomingDelegatedAccess } = await api<{
            IncomingDelegatedAccess: IncomingDelegatedAccessOutput;
        }>(requestDelegatedAccess(id));
        dispatch(delegatedAccessActions.upsertIncomingItem(IncomingDelegatedAccess));
        return IncomingDelegatedAccess;
    };
};

const accessDelegatedAccess = (id: string) => ({
    url: `account/v1/access/${id}/auth`,
    method: 'post',
});

interface AccessDelegatedAccessOutput {
    AccessToken: string;
    TokenType: string;
    Scopes: string[];
    UID: string;
    RefreshToken: string;
    LocalID: number;
    RefreshCounter: number;
    UserKeyToken: string;
}

export const accessDelegatedAccessThunk = ({
    incomingDelegatedAccess,
}: {
    incomingDelegatedAccess: IncomingDelegatedAccessOutput;
}): ThunkAction<
    Promise<{ localID: number }>,
    KtState & UserState & AddressesState & AddressKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            dispatch(
                delegatedAccessActions.loadIncomingItem({
                    id: incomingDelegatedAccess.DelegatedAccessID,
                    type: 'access',
                    value: true,
                })
            );

            const api = getSilentApi(extra.api);
            const result = await api<AccessDelegatedAccessOutput>(
                accessDelegatedAccess(incomingDelegatedAccess.DelegatedAccessID)
            );
            const token = result.UserKeyToken;
            const [addresses, addressKeys] = await Promise.all([
                dispatch(addressesThunk()),
                dispatch(addressKeysThunk({ addressID: incomingDelegatedAccess.TargetAddressID })),
            ]);
            const address = addresses.find(({ ID }) => ID === incomingDelegatedAccess.TargetAddressID);
            if (!address) {
                throw new Error('Address does not exist');
            }
            if (!addressKeys?.length) {
                throw new Error('Address does not have keys');
            }

            const ktUserContext = await dispatch(getKTUserContext());
            const verifiedApiKeys = await getAndVerifyApiKeys({
                api,
                email: incomingDelegatedAccess.SourceEmail,
                ktUserContext,
                internalKeysOnly: false,
                noCache: true,
            }).catch(noop);
            if (!verifiedApiKeys) {
                throw new Error('Source address does not exist');
            }
            const verificationKeys = verifiedApiKeys.addressKeys.map(({ publicKey }) => publicKey);
            if (!verificationKeys?.length) {
                throw new Error('Source address is not setup');
            }

            const accessApi = getUIDApi(result.UID, api);
            const accessUser = await getUser(accessApi);

            const validatedSession = await maybeResumeSessionByUser({
                api,
                User: accessUser,
                // During proton login, ignore resuming an oauth session
                options: { source: [SessionSource.Proton, SessionSource.Saml] },
            });
            if (validatedSession) {
                accessApi(revoke()).catch(noop);
                return { localID: validatedSession.localID };
            }

            const keyPassword = await getDecryptedDelegatedAccessToken({
                armoredMessage: token,
                decryptionKeys: addressKeys.map(({ privateKey }) => privateKey),
                verificationKeys,
            });
            const decryptedKeys = await getDecryptedUserKeysHelper(accessUser, keyPassword);
            if (!decryptedKeys.length) {
                throw new Error('Unable to decrypt user keys with UserKeyToken');
            }

            await persistSession({
                api: accessApi,
                keyPassword,
                User: accessUser,
                LocalID: result.LocalID,
                UID: result.UID,
                // Signing into delegated access doesn't need offline mode support
                clearKeyPassword: '',
                offlineKey: undefined,
                persistent: extra.authentication.getPersistent(),
                trusted: false,
                source: SessionSource.Proton,
            });

            return { localID: result.LocalID };
        } finally {
            dispatch(
                delegatedAccessActions.loadIncomingItem({
                    id: incomingDelegatedAccess.DelegatedAccessID,
                    type: 'access',
                    value: false,
                })
            );
        }
    };
};
