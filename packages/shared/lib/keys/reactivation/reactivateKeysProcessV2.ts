import { OpenPGPKey } from 'pmcrypto';
import { Api, User as tsUser, Address as tsAddress, DecryptedKey, Address, ActiveKey } from '../../interfaces';
import { KeyReactivationData, KeyReactivationRecord, OnKeyReactivationCallback } from './interface';
import { getPrimaryKey } from '../getPrimaryKey';
import { USER_KEY_USERID } from '../userKeys';
import { getAddressReactivationPayload, getReactivatedAddressesKeys } from './reactivateKeyHelper';
import { reactivateUserKeyRouteV2, reactiveLegacyAddressKeyRouteV2 } from '../../api/keys';
import { getHasMigratedAddressKey } from '../keyMigration';
import { getDecryptedAddressKeys } from '../getDecryptedAddressKeys';
import { getSignedKeyList } from '../signedKeyList';
import { generateAddressKeyTokens, reformatAddressKey } from '../addressKeys';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag, getReactivatedKeyFlag } from '../getActiveKeys';
import { SimpleMap } from '../../interfaces/utils';

interface ReactivateUserKeysArguments {
    addressRecordsInV2Format: KeyReactivationRecord[];
    api: Api;
    addresses: Address[];
    user: tsUser;
    activeKeys: ActiveKey[];
    onReactivation: OnKeyReactivationCallback;
    keysToReactivate: KeyReactivationData[];
    keyPassword: string;
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
}: ReactivateUserKeysArguments) => {
    const keyReactivationDataMap = addressRecordsInV2Format.reduce<SimpleMap<KeyReactivationData>>((acc, record) => {
        record.keysToReactivate.forEach((keyData) => {
            acc[keyData.Key.ID] = keyData;
        });
        return acc;
    }, {});

    const reactivatedAddressKeysMap: SimpleMap<boolean> = {};

    let mutableActiveKeys = activeKeys;
    let mutableAddresses = addresses;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: decryptedPrivateKey } = keyToReactivate;
        const { ID } = Key;
        try {
            const email = USER_KEY_USERID;

            if (!decryptedPrivateKey) {
                throw new Error('Missing key');
            }

            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email,
                passphrase: keyPassword,
                privateKey: decryptedPrivateKey,
            });

            const newActiveKey = await getActiveKeyObject(reformattedPrivateKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
            });
            const updatedActiveKeys = [...mutableActiveKeys, newActiveKey];

            const reactivatedAddressKeysResult = await getReactivatedAddressesKeys({
                addresses,
                oldUserKeys: mutableActiveKeys,
                newUserKeys: updatedActiveKeys,
                user,
                keyPassword,
            });
            const addressReactivationPayload = await getAddressReactivationPayload(reactivatedAddressKeysResult);
            mutableAddresses = mutableAddresses.map((address) => {
                const updatedSignedKeyList = addressReactivationPayload.SignedKeyLists[address.ID];
                if (updatedSignedKeyList) {
                    return {
                        ...address,
                        SignedKeyList: updatedSignedKeyList,
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

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');

            // Notify all the address keys that got reactivated from this user key
            reactivatedAddressKeysResult.forEach(({ reactivatedKeys }) => {
                reactivatedKeys?.forEach(({ ID }) => {
                    const reactivationData = keyReactivationDataMap[ID];
                    if (reactivationData) {
                        onReactivation(reactivationData.id, 'ok');
                        reactivatedAddressKeysMap[reactivationData.id] = true;
                    }
                });
            });
        } catch (e) {
            onReactivation(id, e);
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
    };
};

interface ReactivateAddressKeysV2Arguments {
    api: Api;
    address: Address;
    activeKeys: ActiveKey[];
    userKey: OpenPGPKey;
    onReactivation: OnKeyReactivationCallback;
    keysToReactivate: KeyReactivationData[];
}

export const reactivateAddressKeysV2 = async ({
    api,
    address,
    activeKeys,
    keysToReactivate,
    onReactivation,
    userKey,
}: ReactivateAddressKeysV2Arguments) => {
    let mutableActiveKeys = activeKeys;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: decryptedPrivateKey } = keyToReactivate;
        const { ID, Flags } = Key;
        try {
            const email = address.Email;

            if (!decryptedPrivateKey) {
                throw new Error('Missing key');
            }

            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email,
                passphrase: token,
                privateKey: decryptedPrivateKey,
            });

            const newActiveKey = await getActiveKeyObject(reformattedPrivateKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getReactivatedKeyFlag(Flags),
            });
            const updatedActiveKeys = [...mutableActiveKeys, newActiveKey];
            await api(
                reactiveLegacyAddressKeyRouteV2({
                    ID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList: await getSignedKeyList(updatedActiveKeys),
                    Token: encryptedToken,
                    Signature: signature,
                })
            );

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');
        } catch (e) {
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
}

const reactivateKeysProcessV2 = async ({
    api,
    user,
    keyReactivationRecords,
    onReactivation,
    keyPassword,
    addresses: oldAddresses,
    userKeys: oldUserKeys,
}: ReactivateKeysProcessV2Arguments) => {
    const {
        userRecord,
        addressRecordsInV2Format,
        addressRecordsInLegacyFormatOrWithBackup,
    } = keyReactivationRecords.reduce<{
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
    if (userRecord) {
        try {
            const activeUserKeys = await getActiveKeys(null, user.Keys, userKeys);
            const userKeysReactivationResult = await reactivateUserKeys({
                api,
                user,
                activeKeys: activeUserKeys,
                addresses: oldAddresses,
                keysToReactivate: userRecord.keysToReactivate,
                onReactivation,
                keyPassword,
                addressRecordsInV2Format,
            });
            userKeys = userKeysReactivationResult.userKeys;
            addresses = userKeysReactivationResult.addresses;
        } catch (e) {
            userRecord.keysToReactivate.forEach(({ id }) => onReactivation(id, e));
            addressRecordsInV2Format.forEach(({ keysToReactivate }) => {
                keysToReactivate.forEach(({ id }) => onReactivation(id, e));
            });
        }
    }

    const primaryPrivateUserKey = getPrimaryKey(userKeys)?.privateKey;

    for (const { address: oldAddress, keysToReactivate } of addressRecordsInLegacyFormatOrWithBackup) {
        try {
            const address = addresses.find(({ ID: otherID }) => oldAddress?.ID === otherID);
            if (!address || !primaryPrivateUserKey) {
                throw new Error('Missing dependency');
            }

            const addressKeys = await getDecryptedAddressKeys({
                address,
                addressKeys: address.Keys,
                user,
                keyPassword: '',
                userKeys,
            });

            const activeAddressKeys = await getActiveKeys(address.SignedKeyList, address.Keys, addressKeys);

            await reactivateAddressKeysV2({
                api,
                address,
                activeKeys: activeAddressKeys,
                userKey: primaryPrivateUserKey,
                onReactivation,
                keysToReactivate,
            });
        } catch (e) {
            keysToReactivate.forEach(({ id }) => onReactivation(id, e));
        }
    }
};

export default reactivateKeysProcessV2;
