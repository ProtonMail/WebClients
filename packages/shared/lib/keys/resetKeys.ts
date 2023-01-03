import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import { Address, AddressKeyPayloadV2, EncryptionConfig } from '../interfaces';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { getActiveKeyObject, getNormalizedActiveKeys } from './getActiveKeys';
import { getDefaultKeyFlags } from './keyFlags';
import { getSignedKeyList } from './signedKeyList';
import { generateUserKey } from './userKeys';

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
