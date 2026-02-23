import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import type { MnemonicKeyResponse } from '@proton/shared/lib/api/settingsMnemonic';
import { getMnemonicUserKeys } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import type { KeySalt } from '@proton/shared/lib/interfaces';
import type { ReactivateKeyResult } from '@proton/shared/lib/keys';
import {
    type KeyReactivationData,
    type KeyReactivationRecord,
    type KeyReactivationRequestState,
    type KeyReactivationRequestStateData,
    type ReactivateKeysResult,
    decryptPrivateKeyWithSalt,
    getHasMigratedAddressKey,
    reactivateKeysProcess,
} from '@proton/shared/lib/keys';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic/bip39Wrapper';
import { computeKeyPassword } from '@proton/srp/lib';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { AddressKeysState } from '../addressKeys/index';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';

export const reactivateKeysThunk = ({
    keyReactivationRecords,
}: {
    keyReactivationRecords: KeyReactivationRecord[];
}): ThunkAction<
    Promise<ReactivateKeysResult>,
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

            const result = await reactivateKeysProcess({
                api,
                user,
                userKeys,
                addresses,
                keyReactivationRecords,
                keyPassword: extra.authentication.getPassword(),
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(user, userKeys).catch(noop);
            await Promise.all([
                dispatch(userThunk({ cache: CacheType.None })),
                dispatch(addressesThunk({ cache: CacheType.None })),
                dispatch(organizationKeyThunk({ cache: CacheType.None })), // Organization key potentially affected
            ]);

            return result;
        } finally {
            extra.eventManager.start();
        }
    };
};

interface KeyReactivationError {
    id: string;
    error: Error;
}

const getKey = async (
    { id, Key }: KeyReactivationRequestStateData,
    oldPassword: string,
    keySalts: KeySalt[]
): Promise<KeyReactivationData | KeyReactivationError> => {
    if (getHasMigratedAddressKey(Key)) {
        return {
            id,
            Key,
            // Force the type here. Migrated address keys are not reactivated by a password.
        } as KeyReactivationData;
    }
    try {
        const { KeySalt } = keySalts.find(({ ID: keySaltID }) => Key.ID === keySaltID) || {};

        const privateKey = await decryptPrivateKeyWithSalt({
            PrivateKey: Key.PrivateKey,
            keySalt: KeySalt,
            password: oldPassword,
        });

        return {
            id,
            Key,
            privateKey,
        };
    } catch (e: any) {
        return {
            id,
            Key,
            error: new Error(c('Error').t`Incorrect password`),
        };
    }
};

export const getReactivatedKeys = async (
    keysToReactivate: KeyReactivationRequestStateData[],
    oldPassword: string,
    keySalts: KeySalt[]
) => {
    const reactivatedKeys = await Promise.all(
        keysToReactivate.map(async (keyData) => {
            return getKey(keyData, oldPassword, keySalts);
        })
    );
    const errors = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationError => {
        return 'error' in reactivatedKey;
    });
    const process = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationData => {
        return !('error' in reactivatedKey);
    });
    return { process, errors };
};

export const reactivateKeysByPasswordThunk = ({
    keyReactivationStates,
    password,
}: {
    keyReactivationStates: KeyReactivationRequestState[];
    password: string;
}): ThunkAction<
    Promise<ReactivateKeysResult>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const keySalts = await api<{ KeySalts: KeySalt[] }>(getKeySalts())
            .then(({ KeySalts }) => KeySalts)
            .catch(() => []);

        const initialDetails: ReactivateKeyResult[] = [];
        const records = (
            await Promise.all(
                keyReactivationStates.map(async (keyReactivationRecordState) => {
                    const { process, errors } = await getReactivatedKeys(
                        keyReactivationRecordState.keysToReactivate,
                        password,
                        keySalts
                    );
                    errors.forEach((error) => {
                        initialDetails.push({ id: error.id, type: 'error', error: error.error });
                    });
                    if (!process.length) {
                        return;
                    }
                    return {
                        ...keyReactivationRecordState,
                        keysToReactivate: process,
                    };
                })
            )
        ).filter(isTruthy);

        const { details } = await dispatch(
            reactivateKeysThunk({
                keyReactivationRecords: records,
            })
        );

        return {
            details: [...initialDetails, ...details],
        };
    };
};

export const reactivateKeysByMnemonicThunk = ({
    keyReactivationStates,
    mnemonic,
}: {
    keyReactivationStates: KeyReactivationRequestState[];
    mnemonic: string;
}): ThunkAction<
    Promise<
        | { type: 'reactivated'; payload: ReactivateKeysResult }
        | { type: 'no-association' }
        | { type: 'nothing-outdated' }
    >,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const { MnemonicUserKeys } = await api<{ MnemonicUserKeys: MnemonicKeyResponse[] }>(getMnemonicUserKeys());

        const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
        const decryptedMnemonicUserKeys = (
            await Promise.all(
                MnemonicUserKeys.map(async ({ ID, PrivateKey, Salt }) => {
                    try {
                        const hashedPassphrase = await computeKeyPassword(randomBytes, Salt);
                        const decryptedPrivateKey = await CryptoProxy.importPrivateKey({
                            armoredKey: PrivateKey,
                            passphrase: hashedPassphrase,
                        });
                        return {
                            ID,
                            privateKey: decryptedPrivateKey,
                        };
                    } catch (e: any) {
                        return undefined;
                    }
                })
            )
        ).filter(isTruthy);

        const userKeys = await dispatch(userKeysThunk());

        const newlyDecryptedMnemonicUserKeys = decryptedMnemonicUserKeys.filter(({ ID }) => {
            return userKeys.find((userKey) => userKey.ID !== ID);
        });

        if (newlyDecryptedMnemonicUserKeys.length) {
            try {
                const records = keyReactivationStates
                    .filter((state) => !!state.user)
                    .map((keyReactivationRecordState) => {
                        const keysToReactivate = keyReactivationRecordState.keysToReactivate
                            .map(({ id, Key }) => {
                                const decryptedUserKey = newlyDecryptedMnemonicUserKeys.find(({ ID }) => ID === Key.ID);
                                if (!decryptedUserKey) {
                                    return;
                                }
                                return {
                                    id,
                                    Key,
                                    privateKey: decryptedUserKey.privateKey,
                                };
                            })
                            .filter(isTruthy);
                        if (!keysToReactivate.length) {
                            return;
                        }
                        return {
                            ...keyReactivationRecordState,
                            keysToReactivate,
                        };
                    })
                    .filter(isTruthy);

                return {
                    type: 'reactivated',
                    payload: await dispatch(reactivateKeysThunk({ keyReactivationRecords: records })),
                };
            } finally {
                await api(lockSensitiveSettings());
            }
        }

        await api(lockSensitiveSettings());

        if (!newlyDecryptedMnemonicUserKeys.length && decryptedMnemonicUserKeys.length) {
            return {
                type: 'nothing-outdated',
            };
        }

        return {
            type: 'no-association',
        };
    };
};
