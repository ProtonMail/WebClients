import { decryptPrivateKey } from 'pmcrypto';

import isTruthy from '../helpers/isTruthy';
import { noop } from '../helpers/function';
import { DecryptedKey, Key as tsKey, KeyPair, User } from '../interfaces';
import { decryptMemberToken } from './memberToken';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';

const getUserKeyPassword = ({ Token }: tsKey, keyPassword: string, organizationKey?: KeyPair) => {
    if (Token && organizationKey) {
        return decryptMemberToken(Token, [organizationKey.privateKey], [organizationKey.publicKey]);
    }
    return keyPassword;
};

const getDecryptedUserKey = async (Key: tsKey, keyPassword: string, organizationKey?: KeyPair) => {
    const { ID, PrivateKey } = Key;
    const userKeyPassword = await getUserKeyPassword(Key, keyPassword, organizationKey);
    const privateKey = await decryptPrivateKey(PrivateKey, userKeyPassword);
    return {
        ID,
        privateKey,
        publicKey: privateKey.toPublic(),
    };
};

export const getDecryptedUserKeys = async (
    userKeys: tsKey[] = [],
    keyPassword: string,
    organizationKey?: KeyPair
): Promise<DecryptedKey[]> => {
    if (userKeys.length === 0) {
        return [];
    }

    // Attempts to first decrypt the primary key. If this fails, there's no reason to continue with the rest because something is broken.
    const [primaryKey, ...restKeys] = userKeys;
    const primaryKeyResult = await getDecryptedUserKey(primaryKey, keyPassword, organizationKey).catch(noop);
    if (!primaryKeyResult) {
        return [];
    }

    const restKeysResult = await Promise.all(
        restKeys.map((restKey) => getDecryptedUserKey(restKey, keyPassword, organizationKey).catch(noop))
    );
    return [primaryKeyResult, ...restKeysResult].filter(isTruthy);
};

export const getDecryptedUserKeysHelper = async (user: User, keyPassword: string): Promise<DecryptedKey[]> => {
    if (!user.OrganizationPrivateKey) {
        return getDecryptedUserKeys(user.Keys, keyPassword);
    }
    const organizationKey = user.OrganizationPrivateKey
        ? await getDecryptedOrganizationKey(user.OrganizationPrivateKey, keyPassword).catch(noop)
        : undefined;
    if (!organizationKey) {
        return [];
    }
    return getDecryptedUserKeys(user.Keys, keyPassword, organizationKey);
};
