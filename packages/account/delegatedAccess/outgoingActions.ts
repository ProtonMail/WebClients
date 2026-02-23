import { type UnknownAction, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import { verifySKLSignature } from '@proton/key-transparency/verification';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, cacheHelper, createPromiseStore, previousSelector } from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { APPS } from '@proton/shared/lib/constants';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    FetchedSignedKeyList,
} from '@proton/shared/lib/interfaces';
import { ParsedSignedKeyList, type ReactivateKeysResult } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { addressKeysThunk } from '../addressKeys';
import { reactivateKeysThunk } from '../addressKeys/reactivateKeysActions';
import { addressesThunk } from '../addresses';
import { getKTUserContext } from '../kt/actions';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import NoAssociatedKeysError from './NoAssociatedKeyError';
import RetrySignedKeyListError from './RetrySignedKeyListError';
import ValidationError from './ValidationError';
import { getIsOutgoingDelegatedAccessAvailable } from './available';
import {
    generateDelegatedAccessToken,
    getDecryptedDelegatedAccessToken,
    getEncryptedDelegatedAccessToken,
    recoverKeys,
} from './crypto';
import { type DelegatedAccessState, delegatedAccessActions, selectOutgoingDelegatedAccess } from './index';
import type { DelegatedAccessTypeEnum, OutgoingDelegatedAccessOutput } from './interface';

const queryListOutgoingDelegatedAccess = () => ({
    url: `account/v1/access/outgoing`,
    method: 'get',
});

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
            // Only enabled on Account because:
            // 1 emergency contacts requires switch account
            // 2 recovery contacts requires routes which don't exist in the VPN API bundle, e.g. account/v1/access/${outgoingDelegatedAccess.DelegatedAccessID}/recover, which show up in ReactivateKeysModal
            if (extraArgument.config?.APP_NAME !== APPS.PROTONACCOUNT || !getIsOutgoingDelegatedAccessAvailable(user)) {
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
        if (!getIsOutgoingDelegatedAccessAvailable(user)) {
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

const deleteDelegatedAccess = (id: string, data: { Types: DelegatedAccessTypeEnum }) => ({
    url: `account/v1/access/${id}/delete`,
    method: 'put',
    data,
});

export const deleteDelegatedAccessThunk = ({
    id,
    types,
}: {
    id: string;
    types: DelegatedAccessTypeEnum;
}): ThunkAction<Promise<void>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteDelegatedAccess(id, { Types: types }));
        dispatch(delegatedAccessActions.deleteOutgoingItem({ DelegatedAccessID: id, types }));
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

export const recoverDelegatedAccessStep1Thunk = ({
    outgoingDelegatedAccess,
}: {
    outgoingDelegatedAccess: OutgoingDelegatedAccessOutput;
}): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        try {
            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: outgoingDelegatedAccess.DelegatedAccessID,
                    type: 'recover',
                    value: true,
                })
            );
            const api = getSilentApi(extra.api);
            const { DelegatedAccess } = await api<{
                DelegatedAccess: OutgoingDelegatedAccessOutput;
            }>({
                url: `account/v1/access/${outgoingDelegatedAccess.DelegatedAccessID}/recover`,
                method: 'put',
            });
            dispatch(delegatedAccessActions.upsertOutgoingItem(DelegatedAccess));
            return DelegatedAccess;
        } finally {
            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: outgoingDelegatedAccess.DelegatedAccessID,
                    type: 'recover',
                    value: false,
                })
            );
        }
    };
};

export const updateDelegatedAccess = ({
    delegatedAccess,
    api,
}: {
    delegatedAccess: OutgoingDelegatedAccessOutput;
    api: Api;
}): ThunkAction<Promise<OutgoingDelegatedAccessOutput>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        try {
            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: delegatedAccess.DelegatedAccessID,
                    type: 'enable',
                    value: true,
                })
            );

            const payload = await dispatch(
                getAddDelegatedAccessPayloadThunk({
                    api,
                    targetEmail: delegatedAccess.TargetEmail,
                    triggerDelay: delegatedAccess.TriggerDelay,
                    types: delegatedAccess.Types,
                })
            );
            const { DelegatedAccess } = await api<{ DelegatedAccess: OutgoingDelegatedAccessOutput }>(
                editDelegatedAccess(delegatedAccess.DelegatedAccessID, payload)
            );
            dispatch(delegatedAccessActions.upsertOutgoingItem(DelegatedAccess));
            return DelegatedAccess;
        } finally {
            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: delegatedAccess.DelegatedAccessID,
                    type: 'enable',
                    value: false,
                })
            );
        }
    };
};

export const updateAllDelegatedAccesses = ({
    api,
}: {
    api: Api;
}): ThunkAction<
    Promise<OutgoingDelegatedAccessOutput[]>,
    DelegatedAccessState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        // Reactivate all delegated accesses.
        const delegatedAccesses = await dispatch(listOutgoingDelegatedAccess());
        return Promise.all(
            delegatedAccesses.map((delegatedAccess) => {
                return dispatch(updateDelegatedAccess({ delegatedAccess, api }));
            })
        );
    };
};

export const verifyRecoveryKeys = async ({
    signatureAddressKeyID,
    signedKeyList,
    address,
    decryptedAddressKeys,
}: {
    signatureAddressKeyID: string;
    signedKeyList: FetchedSignedKeyList;
    address: Address;
    decryptedAddressKeys: DecryptedAddressKey<PrivateKeyReference>[];
}) => {
    if (!signedKeyList.Data) {
        throw new Error('Signed key list not found');
    }
    if (!signedKeyList.Signature) {
        throw new Error('Signed key list signature not found');
    }
    const parsedSignedKeyList = new ParsedSignedKeyList(signedKeyList.Data);
    const signedKeyListItems = parsedSignedKeyList.getParsedSignedKeyList();
    if (!signedKeyListItems) {
        throw new Error('Unparseable signed key list');
    }
    const signatureAddressKey = address.Keys.find(({ ID }) => ID === signatureAddressKeyID);
    if (!signatureAddressKey) {
        throw new Error('Signature address key not found');
    }
    if (decryptedAddressKeys.some((key) => key.ID === signatureAddressKey.ID)) {
        /*
            TODO: Check if this is needed. We might need to let it pass through to reactivate previous keys?
            throw new NoAssociatedKeysError('Key is already decrypted, no data to recover');
         */
    }
    const verificationKey = await CryptoProxy.importPublicKey({ armoredKey: signatureAddressKey.PrivateKey });
    // Verifies that the SKL was signed by the inactive key
    const timestamp = await verifySKLSignature({
        verificationKeys: [verificationKey],
        signedKeyListData: signedKeyList.Data,
        signedKeyListSignature: signedKeyList.Signature,
    });
    if (!timestamp) {
        throw new Error('Signed key list not verified');
    }
    // Verifies that the key used for verification already existed in key transparency before re-activation
    if (
        !signedKeyListItems.some(
            (key) => verificationKey.getSHA256Fingerprints().join(',') === key.SHA256Fingerprints.join(',')
        )
    ) {
        throw new Error('Signature address key not found in signed key list');
    }
    return { verificationKeys: [verificationKey] };
};

interface RecoverDelegatedAccessStep2Output {
    UserKeys: { UserKeyID: string; PrivateKey: string }[];
    RecoveryToken: string;
    SignatureAddressKeyID: string;
    SignedKeyList: FetchedSignedKeyList | null;
}
export const recoverDelegatedAccessStep2Thunk = ({
    outgoingDelegatedAccess,
    ignoreVerification,
}: {
    outgoingDelegatedAccess: OutgoingDelegatedAccessOutput;
    ignoreVerification: boolean;
}): ThunkAction<Promise<ReactivateKeysResult>, DelegatedAccessState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        let importedVerificationKeys: PublicKeyReference[] | null = null;

        const state = getState();
        const loadingKeys = Object.keys(state.delegatedAccess.outgoingDelegatedAccess.ephemeral || {});
        // Avoid performing multiple recoveries in parallel
        if (loadingKeys.some((key) => key.endsWith('recover-token'))) {
            throw new Error('Try again later');
        }

        try {
            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: outgoingDelegatedAccess.DelegatedAccessID,
                    type: 'recover-token',
                    value: true,
                })
            );

            const api = getSilentApi(extra.api);
            extra.eventManager.stop();

            const { UserKeys, RecoveryToken, SignatureAddressKeyID, SignedKeyList } =
                await api<RecoverDelegatedAccessStep2Output>({
                    url: `account/v1/access/${outgoingDelegatedAccess.DelegatedAccessID}/keys`,
                    method: 'get',
                });

            const addresses = await dispatch(addressesThunk());
            const address = addresses.find((address) => address.ID === outgoingDelegatedAccess.SourceAddressID);
            if (!address) {
                throw new Error('Source address not found');
            }

            const decryptedAddressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));
            if (!decryptedAddressKeys.length) {
                throw new Error('Source address keys not found');
            }

            // In case the SignedKeyList does not exist, let the user take manual action to proceed.
            if (!SignedKeyList && !ignoreVerification) {
                throw new RetrySignedKeyListError();
            }

            const verificationResult = !SignedKeyList
                ? { verificationKeys: null }
                : await verifyRecoveryKeys({
                      address,
                      signedKeyList: SignedKeyList,
                      signatureAddressKeyID: SignatureAddressKeyID,
                      decryptedAddressKeys,
                  });

            importedVerificationKeys = verificationResult.verificationKeys;

            const recoveryToken = await getDecryptedDelegatedAccessToken({
                armoredMessage: RecoveryToken,
                decryptionKeys: decryptedAddressKeys.map((addressKey) => addressKey.privateKey),
                verificationKeys: importedVerificationKeys,
            });

            const [user, userKeys] = await Promise.all([dispatch(userThunk()), dispatch(userKeysThunk())]);

            const recoveredKeys = await recoverKeys({
                recoveryToken,
                UserKeys,
                user,
                userKeys,
            });

            const result = await dispatch(
                reactivateKeysThunk({
                    keyReactivationRecords: [
                        {
                            user,
                            keysToReactivate: recoveredKeys,
                        },
                    ],
                })
            );

            const someReactivatedKeys = result.details.some((value) => value.type === 'success');
            if (!someReactivatedKeys) {
                throw new NoAssociatedKeysError('No keys reactivated');
            }

            // Stop it again since the reactivate keys thunk starts it.
            extra.eventManager.stop();

            // Only update accesses in case data was reactivated
            await dispatch(updateAllDelegatedAccesses({ api }));

            return result;
        } finally {
            extra.eventManager.start();

            // Clean up imported verification keys
            importedVerificationKeys?.forEach((verificationKey) => {
                CryptoProxy.clearKey({ key: verificationKey }).catch(noop);
            });

            dispatch(
                delegatedAccessActions.setOutgoingEphemeral({
                    id: outgoingDelegatedAccess.DelegatedAccessID,
                    type: 'recover-token',
                    value: false,
                })
            );
        }
    };
};
