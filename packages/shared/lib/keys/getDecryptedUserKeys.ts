import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';

import isTruthy from '../helpers/isTruthy';
import { noop } from '../helpers/function';
import { DecryptedKey, Key as tsKey, User } from '../interfaces';
import { decryptMemberToken } from './memberToken';

const getUserKeyPassword = ({ Token }: tsKey, keyPassword: string, organizationKey?: OpenPGPKey) => {
    if (Token && organizationKey) {
        return decryptMemberToken(Token, organizationKey);
    }
    return keyPassword;
};

const getDecryptedUserKey = async (Key: tsKey, keyPassword: string, organizationKey?: OpenPGPKey) => {
    try {
        const { ID, PrivateKey } = Key;
        const userKeyPassword = await getUserKeyPassword(Key, keyPassword, organizationKey);
        const privateKey = await decryptPrivateKey(PrivateKey, userKeyPassword);
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
    user: User;
    userKeys: tsKey[];
    keyPassword: string;
}

export const getDecryptedUserKeys = async ({ user, userKeys = [], keyPassword }: Args): Promise<DecryptedKey[]> => {
    if (userKeys.length === 0) {
        return [];
    }

    const { OrganizationPrivateKey } = user;

    const organizationKey = OrganizationPrivateKey
        ? await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(noop)
        : undefined;

    const [primaryKey, ...restKeys] = userKeys;
    const primaryKeyResult = await getDecryptedUserKey(primaryKey, keyPassword, organizationKey);
    if (!primaryKeyResult) {
        return [];
    }

    const restKeysResult = await Promise.all(
        restKeys.map((restKey) => getDecryptedUserKey(restKey, keyPassword, organizationKey))
    );
    return [primaryKeyResult, ...restKeysResult].filter(isTruthy);
};
