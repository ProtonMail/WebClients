import { type UnknownAction, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, cacheHelper, createPromiseStore, previousSelector } from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address';
import type { Address, Api, DecryptedKey, User } from '@proton/shared/lib/interfaces';
import { isPrivate, isSelf } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import { getKTUserContext } from '../kt/actions';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import ValidationError from './ValidationError';
import { generateDelegatedAccessToken, getEncryptedDelegatedAccessToken } from './crypto';
import { type DelegatedAccessState, delegatedAccessActions, selectOutgoingDelegatedAccess } from './index';
import type { DelegatedAccessTypeEnum, OutgoingDelegatedAccessOutput } from './interface';

const queryListOutgoingDelegatedAccess = () => ({
    url: `account/v1/access/outgoing`,
    method: 'get',
});

const canFetch = (user: User) => isPrivate(user) && isSelf(user);

const promiseStore = createPromiseStore<OutgoingDelegatedAccessOutput[]>();

const previous = previousSelector(selectOutgoingDelegatedAccess);

export const listOutgoingDelegatedAccess = (options?: {
    cache?: CacheType;
}): ThunkAction<
    Promise<OutgoingDelegatedAccessOutput[]>,
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
                DelegatedAccesses: OutgoingDelegatedAccessOutput[];
            }>(queryListOutgoingDelegatedAccess());
            return result.DelegatedAccesses;
        };
        const cb = async () => {
            try {
                dispatch(delegatedAccessActions.pendingOutgoingList());
                const payload = await getPayload();
                dispatch(delegatedAccessActions.fulfillOutgoingList(payload));
                return payload;
            } catch (error) {
                dispatch(delegatedAccessActions.rejectOutgoingList(miniSerializeError(error)));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
    };
};

const getOutgoingDelegatedAccess = async (api: Api, id: string) => {
    const { DelegatedAccess } = await api<{ DelegatedAccess: OutgoingDelegatedAccessOutput }>({
        url: `account/v1/access/outgoing/${id}`,
        method: 'get',
    });
    return DelegatedAccess;
};

export const outgoingEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const user = await dispatch(userThunk());
        if (!canFetch(user)) {
            return;
        }
        await updateCollectionAsyncV6({
            events: event.OutgoingDelegatedAccess,
            get: (ID) => getOutgoingDelegatedAccess(api, ID),
            refetch: () => dispatch(listOutgoingDelegatedAccess({ cache: CacheType.None })),
            update: (result) => dispatch(delegatedAccessActions.outgoingEventLoopV6(result)),
        });
    };
};

interface AddDelegatedAccessPayload {
    Types: DelegatedAccessTypeEnum;
    TargetEmail: string;
    SourceAddressID: string;
    UserKeys: { UserKeyID: string; PrivateKey: string }[];
    UserKeyToken: string;
    TriggerDelay: number;
}

const getAddDelegatedAccessPayload = async ({
    source,
    target,
    userKeys,
    triggerDelay,
    types,
}: {
    triggerDelay: number;
    source: { address: Address; key: PrivateKeyReference };
    target: { email: string; key: PublicKeyReference };
    userKeys: DecryptedKey<PrivateKeyReference>[];
    types: DelegatedAccessTypeEnum;
}): Promise<AddDelegatedAccessPayload> => {
    const token = generateDelegatedAccessToken();
    const encryptedToken = await getEncryptedDelegatedAccessToken({
        token,
        encryptionKeys: [target.key],
        signingKeys: [source.key],
    });
    const reEncryptedUserKeys = await Promise.all(
        userKeys.map(async (userKey) => {
            const result = await CryptoProxy.exportPrivateKey({ privateKey: userKey.privateKey, passphrase: token });
            return { UserKeyID: userKey.ID, PrivateKey: result };
        })
    );
    return {
        Types: types,
        TargetEmail: target.email,
        SourceAddressID: source.address.ID,
        UserKeys: reEncryptedUserKeys,
        UserKeyToken: encryptedToken,
        TriggerDelay: triggerDelay,
    };
};

export const getAddDelegatedAccessPayloadThunk = ({
    api,
    targetEmail,
    triggerDelay,
    types,
}: {
    api: Api;
    targetEmail: string;
    triggerDelay: number;
    types: DelegatedAccessTypeEnum;
}): ThunkAction<Promise<AddDelegatedAccessPayload>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const ktUserContext = await dispatch(getKTUserContext());
        const verifiedApiKeys = await getAndVerifyApiKeys({
            api,
            email: targetEmail,
            ktUserContext,
            internalKeysOnly: false,
            noCache: true,
        }).catch(noop);
        if (!verifiedApiKeys) {
            throw new ValidationError('Address does not exist');
        }
        const targetEncryptionKey = verifiedApiKeys.addressKeys.map(({ publicKey }) => publicKey)?.[0];
        if (!targetEncryptionKey) {
            throw new ValidationError('Address is not setup');
        }

        const [addresses, userKeys] = await Promise.all([dispatch(addressesThunk()), dispatch(userKeysThunk())]);
        const primaryAddress = getPrimaryAddress(addresses) || addresses[0];
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        const primaryAddressKey = (await dispatch(addressKeysThunk({ addressID: primaryAddress.ID })))[0]?.privateKey;
        if (!primaryAddressKey) {
            throw new Error('Missing primary address key');
        }

        return getAddDelegatedAccessPayload({
            source: { address: primaryAddress, key: primaryAddressKey },
            target: { email: targetEmail, key: targetEncryptionKey },
            triggerDelay,
            userKeys,
            types,
        });
    };
};

const addDelegatedAccess = (data: AddDelegatedAccessPayload) => ({
    url: 'account/v1/access',
    method: 'post',
    data,
});

export const addDelegatedAccessThunk = ({
    targetEmail,
    triggerDelay,
    types,
}: {
    targetEmail: string;
    triggerDelay: number;
    types: DelegatedAccessTypeEnum;
}): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const payload = await dispatch(getAddDelegatedAccessPayloadThunk({ api, targetEmail, triggerDelay, types }));
        const { DelegatedAccess } = await api<{
            DelegatedAccess: OutgoingDelegatedAccessOutput;
        }>(addDelegatedAccess(payload));
        dispatch(delegatedAccessActions.upsertOutgoingItem(DelegatedAccess));
        return DelegatedAccess;
    };
};

const editDelegatedAccess = (id: string, data: AddDelegatedAccessPayload) => ({
    url: `account/v1/access/${id}`,
    method: 'put',
    data,
});
export const editDelegatedAccessThunk = ({
    outgoingDelegatedAccess,
    triggerDelay,
    types,
}: {
    outgoingDelegatedAccess: OutgoingDelegatedAccessOutput;
    triggerDelay: number;
    types: DelegatedAccessTypeEnum;
}): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const payload = await dispatch(
            getAddDelegatedAccessPayloadThunk({
                api,
                targetEmail: outgoingDelegatedAccess.TargetEmail,
                triggerDelay,
                types,
            })
        );
        const { DelegatedAccess } = await api<{
            DelegatedAccess: OutgoingDelegatedAccessOutput;
        }>(editDelegatedAccess(outgoingDelegatedAccess.DelegatedAccessID, payload));
        dispatch(delegatedAccessActions.upsertOutgoingItem(DelegatedAccess));
        return DelegatedAccess;
    };
};

export const grantDelegatedAccessThunk = (
    outgoingDelegatedAccess: OutgoingDelegatedAccessOutput
): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        return dispatch(
            editDelegatedAccessThunk({
                outgoingDelegatedAccess,
                triggerDelay: 0,
                types: outgoingDelegatedAccess.Types,
            })
        );
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
}): ThunkAction<Promise<void>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteDelegatedAccess(id));
        dispatch(delegatedAccessActions.deleteOutgoingItem({ DelegatedAccessID: id }));
    };
};

const resetDelegatedAccess = (id: string) => ({
    url: `account/v1/access/${id}/reset`,
    method: 'put',
});

export const resetDelegatedAccessThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const { OutgoingDelegatedAccess } = await api<{
            OutgoingDelegatedAccess: OutgoingDelegatedAccessOutput;
        }>(resetDelegatedAccess(id));
        dispatch(delegatedAccessActions.upsertOutgoingItem(OutgoingDelegatedAccess));
        return OutgoingDelegatedAccess;
    };
};
