import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';

import type { UpgradeAddressKeyPayload } from '../api/keys';
import { upgradeKeysRoute } from '../api/keys';
import { getOrganizationKeys } from '../api/organization';
import { USER_ROLES } from '../constants';
import { toMap } from '../helpers/object';
import type {
    Api,
    CachedOrganizationKey,
    DecryptedKey,
    Key,
    KeyMigrationKTVerifier,
    KeyTransparencyVerify,
    PreAuthKTVerify,
    SignedKeyList,
    User,
    Address as tsAddress,
    Key as tsKey,
    OrganizationKey as tsOrganizationKey,
    User as tsUser,
} from '../interfaces';
import { srpVerify } from '../srp';
import { generateAddressKeyTokens, reformatAddressKey } from './addressKeys';
import { getDecryptedAddressKeysHelper } from './getDecryptedAddressKeys';
import { getCachedOrganizationKey } from './getDecryptedOrganizationKey';
import { getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getHasMigratedAddressKeys } from './keyMigration';
import { reformatOrganizationKey } from './organizationKeys';
import { createSignedKeyListForMigration } from './signedKeyList';
import { USER_KEY_USERID } from './userKeys';

export const getV2KeyToUpgrade = (Key: tsKey) => {
    return Key.Version < 3;
};

export const getV2KeysToUpgrade = (Keys?: tsKey[]) => {
    if (!Keys) {
        return [];
    }
    return Keys.filter(getV2KeyToUpgrade);
};

export const getHasV2KeysToUpgrade = (User: tsUser, Addresses: tsAddress[]) => {
    return (
        getV2KeysToUpgrade(User.Keys).length > 0 ||
        Addresses.some((Address) => getV2KeysToUpgrade(Address.Keys).length > 0)
    );
};

const reEncryptOrReformatKey = async (privateKey: PrivateKeyReference, Key: Key, email: string, passphrase: string) => {
    if (Key && getV2KeyToUpgrade(Key)) {
        return reformatAddressKey({
            email,
            passphrase,
            privateKey,
        });
    }
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });
    return { privateKey, privateKeyArmored };
};

const getReEncryptedKeys = (keys: DecryptedKey[], Keys: Key[], email: string, passphrase: string) => {
    const keysMap = Keys.reduce<{ [key: string]: Key }>((acc, Key) => {
        acc[Key.ID] = Key;
        return acc;
    }, {});
    return Promise.all(
        keys.map(async ({ privateKey, ID }) => {
            const { privateKeyArmored } = await reEncryptOrReformatKey(privateKey, keysMap[ID], email, passphrase);
            return {
                ID,
                PrivateKey: privateKeyArmored,
            };
        })
    );
};

const getReformattedAddressKeysV2 = (
    keys: DecryptedKey[],
    Keys: Key[],
    email: string,
    userKey: PrivateKeyReference
) => {
    const keysMap = Keys.reduce<{ [key: string]: Key }>((acc, Key) => {
        acc[Key.ID] = Key;
        return acc;
    }, {});
    return Promise.all(
        keys.map(async ({ ID, privateKey: originalPrivateKey }) => {
            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
            const { privateKey, privateKeyArmored } = await reEncryptOrReformatKey(
                originalPrivateKey,
                keysMap[ID],
                email,
                token
            );
            const publicKey = await CryptoProxy.importPublicKey({
                binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
            });
            return {
                decryptedKey: {
                    ID,
                    privateKey,
                    publicKey,
                },
                Key: {
                    ID,
                    PrivateKey: privateKeyArmored,
                    Token: encryptedToken,
                    Signature: signature,
                },
            };
        })
    );
};

interface UpgradeV2KeysLegacyArgs {
    loginPassword: string;
    clearKeyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
    user: User;
    userKeys: DecryptedKey[];
    organizationKey?: CachedOrganizationKey;
    addressesKeys: {
        address: tsAddress;
        keys: DecryptedKey[];
    }[];
}

export const upgradeV2KeysLegacy = async ({
    user,
    userKeys,
    addressesKeys,
    organizationKey,
    loginPassword,
    clearKeyPassword,
    isOnePasswordMode,
    api,
}: UpgradeV2KeysLegacyArgs) => {
    const keySalt = generateKeySalt();
    const newKeyPassword = await computeKeyPassword(clearKeyPassword, keySalt);

    const [reformattedUserKeys, reformattedAddressesKeys, reformattedOrganizationKey] = await Promise.all([
        getReEncryptedKeys(userKeys, user.Keys, USER_KEY_USERID, newKeyPassword),
        Promise.all(
            addressesKeys.map(({ address, keys }) => {
                return getReEncryptedKeys(keys, address.Keys, address.Email, newKeyPassword);
            })
        ),
        organizationKey?.privateKey ? reformatOrganizationKey(organizationKey.privateKey, newKeyPassword) : undefined,
    ]);

    const reformattedKeys = [...reformattedUserKeys, ...reformattedAddressesKeys.flat()];

    const config = upgradeKeysRoute({
        KeySalt: keySalt,
        Keys: reformattedKeys,
        OrganizationKey: reformattedOrganizationKey?.privateKeyArmored,
    });

    if (isOnePasswordMode) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config,
        });
        return newKeyPassword;
    }

    await api(config);
    return newKeyPassword;
};

interface UpgradeV2KeysArgs extends UpgradeV2KeysLegacyArgs {
    keyTransparencyVerify: KeyTransparencyVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}

export const upgradeV2KeysV2 = async ({
    user,
    userKeys,
    addressesKeys,
    organizationKey,
    loginPassword,
    clearKeyPassword,
    isOnePasswordMode,
    api,
    keyTransparencyVerify,
    keyMigrationKTVerifier,
}: UpgradeV2KeysArgs) => {
    if (!userKeys.length) {
        return;
    }
    const keySalt = generateKeySalt();
    const newKeyPassword: string = await computeKeyPassword(clearKeyPassword, keySalt);
    const [reformattedUserKeys, reformattedOrganizationKey] = await Promise.all([
        getReEncryptedKeys(userKeys, user.Keys, USER_KEY_USERID, newKeyPassword),
        organizationKey?.privateKey ? reformatOrganizationKey(organizationKey.privateKey, newKeyPassword) : undefined,
    ]);

    const primaryUserKey = await CryptoProxy.importPrivateKey({
        armoredKey: reformattedUserKeys[0].PrivateKey,
        passphrase: newKeyPassword,
    });

    const reformattedAddressesKeys = await Promise.all(
        addressesKeys.map(async ({ address, keys }) => {
            const reformattedAddressKeys = await getReformattedAddressKeysV2(
                keys,
                address.Keys,
                address.Email,
                primaryUserKey
            );
            const [decryptedKeys, addressKeys] = reformattedAddressKeys.reduce<
                [DecryptedKey[], UpgradeAddressKeyPayload[]]
            >(
                (acc, cur) => {
                    acc[0].push(cur.decryptedKey);
                    acc[1].push(cur.Key);
                    return acc;
                },
                [[], []]
            );
            const [signedKeyList, onSKLPublishSuccess] = await createSignedKeyListForMigration({
                api,
                address,
                decryptedKeys,
                keyTransparencyVerify,
                keyMigrationKTVerifier,
            });
            return {
                address,
                addressKeys,
                signedKeyList: signedKeyList,
                onSKLPublishSuccess: onSKLPublishSuccess,
            };
        })
    );

    const AddressKeys = reformattedAddressesKeys.map(({ addressKeys }) => addressKeys).flat();
    const SignedKeyLists = reformattedAddressesKeys.reduce<{ [id: string]: SignedKeyList }>(
        (acc, { address, signedKeyList }) => {
            if (signedKeyList) {
                acc[address.ID] = signedKeyList;
            }
            return acc;
        },
        {}
    );

    const config = upgradeKeysRoute({
        KeySalt: keySalt,
        UserKeys: reformattedUserKeys,
        AddressKeys,
        OrganizationKey: reformattedOrganizationKey?.privateKeyArmored,
        SignedKeyLists,
    });

    await Promise.all(
        reformattedAddressesKeys.map(({ onSKLPublishSuccess }) =>
            onSKLPublishSuccess ? onSKLPublishSuccess() : Promise.resolve()
        )
    );

    if (isOnePasswordMode) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config,
        });
        return newKeyPassword;
    }

    await api(config);
    return newKeyPassword;
};

interface UpgradeV2KeysHelperArgs {
    addresses: tsAddress[];
    user: tsUser;
    loginPassword: string;
    clearKeyPassword: string;
    keyPassword: string;
    api: Api;
    isOnePasswordMode?: boolean;
    preAuthKTVerify: PreAuthKTVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}

export const upgradeV2KeysHelper = async ({
    user,
    addresses,
    loginPassword,
    clearKeyPassword,
    keyPassword,
    isOnePasswordMode,
    api,
    preAuthKTVerify,
    keyMigrationKTVerifier,
}: UpgradeV2KeysHelperArgs) => {
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);

    const addressesKeys = await Promise.all(
        addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, keyPassword),
            };
        })
    );

    const organizationKey =
        user.Role === USER_ROLES.ADMIN_ROLE
            ? await api<tsOrganizationKey>(getOrganizationKeys()).then((Key) => {
                  return getCachedOrganizationKey({ keyPassword, Key, userKeys });
              })
            : undefined;

    if (!clearKeyPassword || !loginPassword) {
        throw new Error('Password required');
    }
    // Not allowed signed into member
    if (user.OrganizationPrivateKey) {
        return;
    }

    const userKeyMap = toMap(user.Keys, 'ID');
    const hasDecryptedUserKeysToUpgrade = userKeys.some(({ privateKey, ID }) => {
        const Key = userKeyMap[ID];
        return Key && privateKey && getV2KeyToUpgrade(Key);
    });
    const hasDecryptedAddressKeyToUpgrade = addressesKeys.some(({ address, keys }) => {
        const addressKeyMap = toMap(address.Keys, 'ID');
        return keys.some(({ privateKey, ID }) => {
            const Key = addressKeyMap[ID];
            return Key && privateKey && getV2KeyToUpgrade(Key);
        });
    });

    if (!hasDecryptedUserKeysToUpgrade && !hasDecryptedAddressKeyToUpgrade) {
        return;
    }

    if (getHasMigratedAddressKeys(addresses)) {
        const keyTransparencyVerify = preAuthKTVerify(userKeys);

        return upgradeV2KeysV2({
            api,
            user,
            userKeys,
            addressesKeys,
            organizationKey,
            loginPassword,
            clearKeyPassword,
            isOnePasswordMode,
            keyTransparencyVerify,
            keyMigrationKTVerifier,
        });
    }

    return upgradeV2KeysLegacy({
        api,
        user,
        userKeys,
        addressesKeys,
        organizationKey,
        loginPassword,
        clearKeyPassword,
        isOnePasswordMode,
    });
};
