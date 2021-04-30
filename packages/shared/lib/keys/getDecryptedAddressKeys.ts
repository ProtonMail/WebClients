import { decryptPrivateKey } from 'pmcrypto';

import isTruthy from '../helpers/isTruthy';
import { Address, DecryptedKey, Key as tsKey, KeyPair, KeysPair, User } from '../interfaces';
import { decryptMemberToken } from './memberToken';
import { splitKeys } from './keys';
import { getAddressKeyToken } from './addressKeys';
import { MEMBER_PRIVATE } from '../constants';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { noop } from '../helpers/function';

interface GetDecryptedAddressKeyArguments {
    user: User;
    userKeys: KeysPair;
    keyPassword: string;
    organizationKey?: KeyPair;
}

const getAddressKeyPassword = (
    { Activation, Token, Signature }: tsKey,
    { user, userKeys, keyPassword, organizationKey }: GetDecryptedAddressKeyArguments
) => {
    const { OrganizationPrivateKey, Private } = user;

    if (!OrganizationPrivateKey && Private === MEMBER_PRIVATE.READABLE) {
        // Since the activation process is asynchronous, allow the private key to get decrypted already here so that it can be used
        if (Activation) {
            return decryptMemberToken(Activation, userKeys.privateKeys, userKeys.publicKeys);
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
    const { ID, PrivateKey } = addressKey;

    const addressKeyPassword = await getAddressKeyPassword(addressKey, options);
    const privateKey = await decryptPrivateKey(PrivateKey, addressKeyPassword);
    return {
        ID,
        privateKey,
        publicKey: privateKey.toPublic(),
    };
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
        ? await getDecryptedOrganizationKey(OrganizationPrivateKey, keyPassword).catch(noop)
        : undefined;

    const userKeysPair = splitKeys(userKeys);

    const [primaryKey, ...restKeys] = addressKeys;

    const primaryKeyResult = await getDecryptedAddressKey(primaryKey, {
        userKeys: userKeysPair,
        keyPassword,
        organizationKey,
        user,
    }).catch(noop);

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
            }).catch(noop);
        })
    );

    return [primaryKeyResult, ...restKeyResults].filter(isTruthy);
};
