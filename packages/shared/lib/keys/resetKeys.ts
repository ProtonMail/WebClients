import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import { Address, AddressKeyPayload, AddressKeyPayloadV2, EncryptionConfig } from '../interfaces';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { getActiveKeyObject, getNormalizedActiveKeys } from './getActiveKeys';
import { getDefaultKeyFlags } from './keyFlags';
import { getHasMigratedAddressKeys } from './keyMigration';
import { getSignedKeyList } from './signedKeyList';
import { generateUserKey } from './userKeys';

interface Arguments {
    addresses: Address[];
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
}

export const getResetAddressesKeysLegacy = async ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
}: Arguments): Promise<
    | { userKeyPayload: string; addressKeysPayload: AddressKeyPayload[] }
    | { userKeyPayload: undefined; addressKeysPayload: undefined }
> => {
    if (!addresses.length) {
        return { userKeyPayload: undefined, addressKeysPayload: undefined };
    }

    const addressKeysPayload = await Promise.all(
        addresses.map(async (address) => {
            const { ID: AddressID, Email } = address;
            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: Email,
                passphrase,
                encryptionConfig,
            });

            const newPrimaryKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });

            const signedKeyList = await getSignedKeyList(getNormalizedActiveKeys(address, [newPrimaryKey]));
            return {
                AddressID,
                PrivateKey: privateKeyArmored,
                SignedKeyList: signedKeyList,
            };
        })
    );

    return { userKeyPayload: addressKeysPayload[0].PrivateKey, addressKeysPayload };
};

export const getResetAddressesKeysV2 = async ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
}: {
    addresses: Address[];
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
}): Promise<
    | { userKeyPayload: string; addressKeysPayload: AddressKeyPayloadV2[] }
    | { userKeyPayload: undefined; addressKeysPayload: undefined }
> => {
    if (!addresses.length) {
        return { userKeyPayload: undefined, addressKeysPayload: undefined };
    }
    const { privateKey: userKey, privateKeyArmored: userKeyPayload } = await generateUserKey({
        passphrase,
        encryptionConfig,
    });

    const addressKeysPayload = await Promise.all(
        addresses.map(async (address) => {
            const { ID: AddressID, Email } = address;

            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);

            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: Email,
                passphrase: token,
                encryptionConfig,
            });

            const newPrimaryKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: 1,
                flags: getDefaultKeyFlags(address),
            });

            const signedKeyList = await getSignedKeyList(getNormalizedActiveKeys(address, [newPrimaryKey]));
            return {
                AddressID,
                PrivateKey: privateKeyArmored,
                SignedKeyList: signedKeyList,
                Token: encryptedToken,
                Signature: signature,
            };
        })
    );

    return { userKeyPayload, addressKeysPayload };
};

export const getResetAddressesKeys = ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    hasAddressKeyMigrationGeneration,
}: Arguments & { hasAddressKeyMigrationGeneration: boolean }) => {
    if (hasAddressKeyMigrationGeneration || getHasMigratedAddressKeys(addresses)) {
        return getResetAddressesKeysV2({ addresses, passphrase, encryptionConfig });
    }
    return getResetAddressesKeysLegacy({ addresses, passphrase, encryptionConfig });
};
