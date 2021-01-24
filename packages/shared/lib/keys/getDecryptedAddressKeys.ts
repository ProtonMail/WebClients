import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';

import isTruthy from '../helpers/isTruthy';
import { Address, DecryptedKey, Key as tsKey, KeyPair, KeysPair, User } from '../interfaces';
import { decryptMemberToken } from './memberToken';
import { splitKeys } from './keys';
import { getAddressKeyToken } from './addressKeys';
import { MEMBER_PRIVATE } from '../constants';

interface GetDecryptedAddressKeyArguments {
    user: User;
    userKeys: KeysPair;
    keyPassword: string;
    organizationKey?: OpenPGPKey;
}

const getAddressKeyPassword = (
    { Activation, Token, Signature }: tsKey,
    { user, userKeys, keyPassword, organizationKey }: GetDecryptedAddressKeyArguments
) => {
    const primaryPrivateUserKey = userKeys.privateKeys[0];
    const { OrganizationPrivateKey, Private } = user;

    if (!OrganizationPrivateKey && Private === MEMBER_PRIVATE.READABLE && primaryPrivateUserKey) {
        // Since the activation process is asynchronous, allow the private key to get decrypted already here so that it can be used
        if (Activation) {
            return decryptMemberToken(Activation, primaryPrivateUserKey);
        }
    }

    if (Token) {
        return getAddressKeyToken({
            Token,
            Signature,
            organizationKey,
            privateKeys: userKeys.privateKeys,
            publicKeys: userKeys.publicKeys,
        });
    }

    return keyPassword;
};

const getDecryptedAddressKey = async (addressKey: tsKey, options: GetDecryptedAddressKeyArguments) => {
    try {
        const { ID, PrivateKey } = addressKey;

        const addressKeyPassword = await getAddressKeyPassword(addressKey, options);
        const privateKey = await decryptPrivateKey(PrivateKey, addressKeyPassword);
        return {
            ID,
            privateKey,
            publicKey: privateKey.toPublic(),
        };
    } catch (e) {
        return undefined;
    }
};

interface Args {
    address: Address;
    user: User;
    userKeys: KeyPair[];
    keyPassword: string;
    addressKeys: tsKey[];
}

export const getDecryptedAddressKeys = async ({
    addressKeys = [],
    user,
    userKeys = [],
    keyPassword,
}: Args): Promise<DecryptedKey[]> => {
    if (!addressKeys.length || !userKeys.length) {
        return [];
    }

    const { OrganizationPrivateKey } = user;

    const organizationKey = OrganizationPrivateKey
        ? await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(() => undefined)
        : undefined;

    const userKeysPair = splitKeys(userKeys);

    const [primaryKey, ...restKeys] = addressKeys;

    const primaryKeyResult = await getDecryptedAddressKey(primaryKey, {
        userKeys: userKeysPair,
        keyPassword,
        organizationKey,
        user,
    });

    // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
    if (!primaryKeyResult) {
        return [];
    }

    const restKeyResults = await Promise.all(
        restKeys.map((restKey) => {
            return getDecryptedAddressKey(restKey, {
                userKeys: userKeysPair,
                keyPassword,
                organizationKey,
                user,
            });
        })
    );

    return [primaryKeyResult, ...restKeyResults].filter(isTruthy);
};
