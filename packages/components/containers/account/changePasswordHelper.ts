import { OpenPGPKey, encryptPrivateKey } from 'pmcrypto';
import { srpAuth, srpVerify } from 'proton-shared/lib/srp';
import { unlockPasswordChanges } from 'proton-shared/lib/api/user';
import { updatePassword } from 'proton-shared/lib/api/settings';
import { updatePrivateKeyRoute } from 'proton-shared/lib/api/keys';
import { noop } from 'proton-shared/lib/helpers/function';
import { CachedKey, Api } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

/**
 * Encrypt a private key with a new password if it's decrypted.
 */
const getEncryptedArmoredKey = ({ Key: { ID }, privateKey }: CachedKey, newKeyPassword: string) => {
    if (!privateKey || !privateKey.isDecrypted()) {
        return;
    }
    return encryptPrivateKey(privateKey, newKeyPassword)
        .then((armoredPrivateKey) => {
            return { ID, PrivateKey: armoredPrivateKey };
        })
        .catch(noop);
};

/**
 * Encrypt the organization key with a new password if it exists.
 */
const getEncryptedArmoredOrganizationKey = (organizationKey: OpenPGPKey | undefined, newKeyPassword: string) => {
    if (!organizationKey || !organizationKey.isDecrypted()) {
        return;
    }
    return encryptPrivateKey(organizationKey, newKeyPassword).catch(noop);
};

/**
 * Get all private keys encrypted with a new password.
 */
interface GetArmoredPrivateKeysArguments {
    userKeysList: CachedKey[];
    addressesKeysMap: { [key: string]: CachedKey[] };
    organizationKey?: OpenPGPKey;
    keyPassword: string;
}
export const getArmoredPrivateKeys = async ({
    userKeysList,
    addressesKeysMap,
    organizationKey,
    keyPassword
}: GetArmoredPrivateKeysArguments) => {
    const userKeysPromises = userKeysList.map((key) => getEncryptedArmoredKey(key, keyPassword));
    const userKeysAndAddressesKeysPromises = Object.keys(addressesKeysMap).reduce((acc, addressKey) => {
        return acc.concat(addressesKeysMap[addressKey].map((key) => getEncryptedArmoredKey(key, keyPassword)));
    }, userKeysPromises);

    const armoredKeys = (await Promise.all(userKeysAndAddressesKeysPromises)).filter(isTruthy);

    // A user may not have his key setup. But in that case the key password should not be set.
    if (!keyPassword && armoredKeys.length === 0) {
        const decryptedError = new Error('No decrypted keys exist');
        decryptedError.name = 'NoDecryptedKeys';
        throw decryptedError;
    }

    return {
        armoredKeys,
        armoredOrganizationKey: await getEncryptedArmoredOrganizationKey(organizationKey, keyPassword)
    };
};

interface ChangeMailboxPasswordArguments {
    api: Api;
    armoredKeys: { ID: string; PrivateKey: string }[];
    keySalt: string;
    armoredOrganizationKey?: string;
}
export const handleChangeMailboxPassword = ({
    api,
    armoredKeys,
    armoredOrganizationKey,
    keySalt
}: ChangeMailboxPasswordArguments) => {
    return api(
        updatePrivateKeyRoute({
            Keys: armoredKeys,
            KeySalt: keySalt,
            OrganizationKey: armoredOrganizationKey
        })
    );
};

interface ChangeOnePasswordArguments extends ChangeMailboxPasswordArguments {
    newPassword: string;
    totp?: string;
}
export const handleChangeOnePassword = ({
    api,
    armoredKeys,
    armoredOrganizationKey,
    keySalt,
    newPassword,
    totp
}: ChangeOnePasswordArguments) => {
    return srpVerify({
        api,
        credentials: {
            password: newPassword,
            totp
        },
        config: updatePrivateKeyRoute({
            Keys: armoredKeys,
            OrganizationKey: armoredOrganizationKey,
            KeySalt: keySalt
        })
    });
};

export const handleUnlock = ({ api, oldPassword, totp }: { api: Api; oldPassword: string; totp?: string }) => {
    return srpAuth({
        api,
        credentials: {
            password: oldPassword,
            totp
        },
        config: unlockPasswordChanges()
    });
};

export const handleChangeLoginPassword = async ({ api, newPassword }: { api: Api; newPassword: string }) => {
    return srpVerify({
        api,
        credentials: {
            password: newPassword
        },
        config: updatePassword()
    });
};
