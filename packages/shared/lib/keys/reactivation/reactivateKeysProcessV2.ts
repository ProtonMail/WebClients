import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { getApiError } from '../../api/helpers/apiErrorHelper';
import { reactivateUserKeyRouteV2, reactiveLegacyAddressKeyRouteV2 } from '../../api/keys';
import { HTTP_STATUS_CODE } from '../../constants';
import {
    ActiveKey,
    Address,
    Api,
    DecryptedKey,
    KeyTransparencyVerify,
    Address as tsAddress,
    User as tsUser,
} from '../../interfaces';
import { SimpleMap } from '../../interfaces/utils';
import { generateAddressKeyTokens } from '../addressKeys';
import {
    getActiveKeyObject,
    getActiveKeys,
    getNormalizedActiveKeys,
    getPrimaryFlag,
    getReactivatedKeyFlag,
} from '../getActiveKeys';
import { getDecryptedAddressKeysHelper } from '../getDecryptedAddressKeys';
import { getPrimaryKey } from '../getPrimaryKey';
import { getHasMigratedAddressKey } from '../keyMigration';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';
import { KeyReactivationData, KeyReactivationRecord, OnKeyReactivationCallback } from './interface';
import { getAddressReactivationPayload, getReactivatedAddressesKeys, resetUserId } from './reactivateKeyHelper';

interface ReactivateUserKeysArguments {
    addressRecordsInV2Format: KeyReactivationRecord[];
    api: Api;
    addresses: Address[];
    user: tsUser;
    activeKeys: ActiveKey[];
    onReactivation: OnKeyReactivationCallback;
    keysToReactivate: KeyReactivationData[];
    keyPassword: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const reactivateUserKeys = async ({
    addressRecordsInV2Format,
    api,
    addresses,
    user,
    activeKeys,
    keysToReactivate,
    onReactivation,
    keyPassword,
    keyTransparencyVerify,
}: ReactivateUserKeysArguments) => {
    const keyReactivationDataMap = addressRecordsInV2Format.reduce<SimpleMap<KeyReactivationData>>((acc, record) => {
        record.keysToReactivate.forEach((keyData) => {
            acc[keyData.Key.ID] = keyData;
        });
        return acc;
    }, {});
    const reactivatedAddressKeysMap: SimpleMap<boolean> = {};
    const allReactivatedAddressKeysMap: SimpleMap<boolean> = {};

    let mutableActiveKeys = activeKeys;
    let mutableAddresses = addresses;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: reactivatedKey } = keyToReactivate;
        const { ID } = Key;
        try {
            if (!reactivatedKey) {
                throw new Error('Missing key');
            }

            await resetUserId(Key, reactivatedKey);

            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey: reactivatedKey,
                passphrase: keyPassword,
            });
            const newActiveKey = await getActiveKeyObject(reactivatedKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getDefaultKeyFlags(undefined),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(undefined, [...mutableActiveKeys, newActiveKey]);

            const reactivatedAddressKeysResult = await getReactivatedAddressesKeys({
                addresses,
                oldUserKeys: mutableActiveKeys,
                newUserKeys: updatedActiveKeys,
                user,
                keyPassword,
                keyTransparencyVerify,
            });
            const addressReactivationPayload = getAddressReactivationPayload(reactivatedAddressKeysResult);
            mutableAddresses = mutableAddresses.map((address) => {
                const updatedSignedKeyList = addressReactivationPayload.SignedKeyLists[address.ID];
                if (updatedSignedKeyList) {
                    return {
                        ...address,
                        SignedKeyList: {
                            ...updatedSignedKeyList,
                            MinEpochID: null,
                            MaxEpochID: null,
                        },
                    };
                }
                return address;
            });
            await api(
                reactivateUserKeyRouteV2({
                    ID,
                    PrivateKey: privateKeyArmored,
                    ...addressReactivationPayload,
                })
            );
            // Only once the SKLs have been successfully posted we add it to the KT commit state.
            await Promise.all(
                reactivatedAddressKeysResult.map(({ onSKLPublishSuccess }) =>
                    onSKLPublishSuccess ? onSKLPublishSuccess() : Promise.resolve()
                )
            );

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');

            // Notify all the address keys that got reactivated from this user key
            reactivatedAddressKeysResult.forEach(({ reactivatedKeys }) => {
                reactivatedKeys?.forEach(({ ID }) => {
                    allReactivatedAddressKeysMap[ID] = true;
                    const reactivationData = keyReactivationDataMap[ID];
                    if (reactivationData) {
                        onReactivation(reactivationData.id, 'ok');
                        reactivatedAddressKeysMap[reactivationData.id] = true;
                    }
                });
            });
        } catch (e: any) {
            onReactivation(id, e);
            const { status } = getApiError(e);
            if (status === HTTP_STATUS_CODE.FORBIDDEN) {
                // The password prompt has been cancelled. No need to attempt to reactivate the other keys.
                break;
            }
        }
    }

    addressRecordsInV2Format.forEach(({ keysToReactivate }) => {
        keysToReactivate.forEach(({ id, privateKey }) => {
            if (!reactivatedAddressKeysMap[id] && !privateKey) {
                onReactivation(id, new Error('User key inactivate'));
            }
        });
    });

    return {
        userKeys: mutableActiveKeys,
        addresses: mutableAddresses,
        allReactivatedAddressKeysMap,
    };
};

interface ReactivateAddressKeysV2Arguments {
    api: Api;
    address: Address;
    activeKeys: ActiveKey[];
    userKey: PrivateKeyReference;
    onReactivation: OnKeyReactivationCallback;
    keysToReactivate: KeyReactivationData[];
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const reactivateAddressKeysV2 = async ({
    api,
    address,
    activeKeys,
    keysToReactivate,
    onReactivation,
    userKey,
    keyTransparencyVerify,
}: ReactivateAddressKeysV2Arguments) => {
    let mutableActiveKeys = activeKeys;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: reactivatedKey } = keyToReactivate;
        const { ID, Flags } = Key;
        try {
            if (!reactivatedKey) {
                throw new Error('Missing key');
            }

            await resetUserId(Key, reactivatedKey);

            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey: reactivatedKey,
                passphrase: token,
            });
            const newActiveKey = await getActiveKeyObject(reactivatedKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getReactivatedKeyFlag(address, Flags),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [...mutableActiveKeys, newActiveKey]);
            const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                updatedActiveKeys,
                address,
                keyTransparencyVerify
            );
            await api(
                reactiveLegacyAddressKeyRouteV2({
                    ID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList: signedKeyList,
                    Token: encryptedToken,
                    Signature: signature,
                })
            );
            await onSKLPublishSuccess();

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');
        } catch (e: any) {
            onReactivation(id, e);
        }
    }

    return mutableActiveKeys;
};

export interface ReactivateKeysProcessV2Arguments {
    api: Api;
    user: tsUser;
    keyPassword: string;
    addresses: tsAddress[];
    userKeys: DecryptedKey[];
    keyReactivationRecords: KeyReactivationRecord[];
    onReactivation: OnKeyReactivationCallback;
    keyTransparencyVerify: KeyTransparencyVerify;
}

const reactivateKeysProcessV2 = async ({
    api,
    user,
    keyReactivationRecords,
    onReactivation,
    keyPassword,
    addresses: oldAddresses,
    userKeys: oldUserKeys,
    keyTransparencyVerify,
}: ReactivateKeysProcessV2Arguments) => {
    const { userRecord, addressRecordsInV2Format, addressRecordsInLegacyFormatOrWithBackup } =
        keyReactivationRecords.reduce<{
            addressRecordsInV2Format: KeyReactivationRecord[];
            addressRecordsInLegacyFormatOrWithBackup: KeyReactivationRecord[];
            userRecord?: KeyReactivationRecord;
        }>(
            (acc, record) => {
                const { user, address, keysToReactivate, keys } = record;
                if (user) {
                    acc.userRecord = record;
                }
                if (address) {
                    const keysInV2Format = keysToReactivate.filter(
                        ({ privateKey, Key }) => !privateKey && getHasMigratedAddressKey(Key)
                    );
                    const keysInLegacyFormatOrWithBackup = keysToReactivate.filter(
                        ({ privateKey, Key }) => privateKey || !getHasMigratedAddressKey(Key)
                    );

                    if (keysInV2Format.length) {
                        acc.addressRecordsInV2Format.push({
                            address,
                            keys,
                            keysToReactivate: keysInV2Format,
                        });
                    }

                    if (keysInLegacyFormatOrWithBackup.length) {
                        acc.addressRecordsInLegacyFormatOrWithBackup.push({
                            address,
                            keys,
                            keysToReactivate: keysInLegacyFormatOrWithBackup,
                        });
                    }
                }
                return acc;
            },

            { addressRecordsInV2Format: [], addressRecordsInLegacyFormatOrWithBackup: [], userRecord: undefined }
        );

    let userKeys = oldUserKeys;
    let addresses = oldAddresses;
    let allReactivatedAddressKeysMap: SimpleMap<boolean> = {};
    if (userRecord) {
        try {
            const activeUserKeys = await getActiveKeys(undefined, null, user.Keys, userKeys);
            const userKeysReactivationResult = await reactivateUserKeys({
                api,
                user,
                activeKeys: activeUserKeys,
                addresses: oldAddresses,
                keysToReactivate: userRecord.keysToReactivate,
                onReactivation,
                keyPassword,
                addressRecordsInV2Format,
                keyTransparencyVerify,
            });
            userKeys = userKeysReactivationResult.userKeys;
            addresses = userKeysReactivationResult.addresses;
            allReactivatedAddressKeysMap = userKeysReactivationResult.allReactivatedAddressKeysMap;
        } catch (e: any) {
            userRecord.keysToReactivate.forEach(({ id }) => onReactivation(id, e));
            addressRecordsInV2Format.forEach(({ keysToReactivate }) => {
                keysToReactivate.forEach(({ id }) => onReactivation(id, e));
            });
        }
    }

    const primaryPrivateUserKey = getPrimaryKey(userKeys)?.privateKey;

    for (const { address: oldAddress, keysToReactivate } of addressRecordsInLegacyFormatOrWithBackup) {
        const keysLeftToReactivate: KeyReactivationData[] = [];
        keysToReactivate.forEach((x) => {
            // Even if this key was uploaded, it may have gotten reactivated from a user key earlier, and so it
            // should not be attempted to be reactivated again
            const alreadyReactivated = allReactivatedAddressKeysMap[x.Key.ID] === true;
            if (alreadyReactivated) {
                onReactivation(x.id, 'ok');
            } else {
                keysLeftToReactivate.push(x);
            }
        });
        try {
            const address = addresses.find(({ ID: otherID }) => oldAddress?.ID === otherID);
            if (!address || !primaryPrivateUserKey) {
                throw new Error('Missing dependency');
            }

            const addressKeys = await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, '');
            const activeAddressKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);

            await reactivateAddressKeysV2({
                api,
                address,
                activeKeys: activeAddressKeys,
                userKey: primaryPrivateUserKey,
                onReactivation,
                keysToReactivate: keysLeftToReactivate,
                keyTransparencyVerify,
            });
        } catch (e: any) {
            keysLeftToReactivate.forEach(({ id }) => onReactivation(id, e));
        }
    }
};

export default reactivateKeysProcessV2;
