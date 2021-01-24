import { encryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { Address as tsAddress, DecryptedKey } from '../interfaces';
import { noop } from '../helpers/function';
import isTruthy from '../helpers/isTruthy';

import { getHasMigratedAddressKeys } from './keyMigration';
import { getEncryptedArmoredAddressKey } from './addressKeys';

const getEncryptedArmoredUserKey = async ({ ID, privateKey }: DecryptedKey, newKeyPassword: string) => {
    if (!privateKey || !privateKey.isDecrypted()) {
        return;
    }
    const privateKeyArmored = await encryptPrivateKey(privateKey, newKeyPassword);
    return {
        ID,
        PrivateKey: privateKeyArmored,
    };
};

export const getEncryptedArmoredOrganizationKey = async (
    organizationKey: OpenPGPKey | undefined,
    newKeyPassword: string
) => {
    if (!organizationKey || !organizationKey.isDecrypted()) {
        return;
    }
    return encryptPrivateKey(organizationKey, newKeyPassword);
};

export const getArmoredPrivateUserKeys = async (keys: DecryptedKey[], keyPassword: string) => {
    if (keys.length === 0) {
        return [];
    }
    const armoredKeys = await Promise.all(
        keys.map((key) => {
            return getEncryptedArmoredUserKey(key, keyPassword).catch(noop);
        })
    );
    const result = armoredKeys.filter(isTruthy);

    if (result.length === 0) {
        const decryptedError = new Error('No decrypted keys exist');
        decryptedError.name = 'NoDecryptedKeys';
        throw decryptedError;
    }

    return result;
};

export const getArmoredPrivateAddressKeys = async (keys: DecryptedKey[], address: tsAddress, keyPassword: string) => {
    const armoredKeys = await Promise.all(
        keys.map(async ({ ID, privateKey }) => {
            const PrivateKey = await getEncryptedArmoredAddressKey(privateKey, address.Email, keyPassword).catch(noop);
            if (!PrivateKey) {
                return;
            }
            return {
                ID,
                PrivateKey,
            };
        })
    );

    const result = armoredKeys.filter(isTruthy);

    if (result.length === 0) {
        const decryptedError = new Error('No decrypted keys exist');
        decryptedError.name = 'NoDecryptedKeys';
        throw decryptedError;
    }

    return result;
};

interface AddressesKeys {
    address: tsAddress;
    keys: DecryptedKey[];
}

export const getArmoredPrivateAddressesKeys = async (addressesWithKeysList: AddressesKeys[], keyPassword: string) => {
    const result = await Promise.all(
        addressesWithKeysList.map(({ address, keys }) => {
            if (!keys.length) {
                return;
            }
            return getArmoredPrivateAddressKeys(keys, address, keyPassword);
        })
    );
    return result.flat().filter(isTruthy);
};

export const getUpdateKeysPayload = async (
    addressesKeys: AddressesKeys[],
    userKeys: DecryptedKey[],
    organizationKey: OpenPGPKey | undefined,
    keyPassword: string,
    keySalt: string
) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addressesKeys.map(({ address }) => address));

    const [armoredUserKeys, armoredAddressesKeys, armoredOrganizationKey] = await Promise.all([
        getArmoredPrivateUserKeys(userKeys, keyPassword),
        hasMigratedAddressKeys ? [] : getArmoredPrivateAddressesKeys(addressesKeys, keyPassword),
        getEncryptedArmoredOrganizationKey(organizationKey, keyPassword),
    ]);

    return hasMigratedAddressKeys
        ? {
              UserKeys: armoredUserKeys,
              KeySalt: keySalt,
              OrganizationKey: armoredOrganizationKey,
          }
        : {
              Keys: [...armoredUserKeys, ...armoredAddressesKeys],
              KeySalt: keySalt,
              OrganizationKey: armoredOrganizationKey,
          };
};
