import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import { Address, AddressKeyPayloadV2, EncryptionConfig, PreAuthKTVerify } from '../interfaces';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { getActiveKeyObject, getNormalizedActiveKeys } from './getActiveKeys';
import { getDefaultKeyFlags } from './keyFlags';
import { OnSKLPublishSuccess, getSignedKeyListWithDeferredPublish } from './signedKeyList';
import { generateUserKey } from './userKeys';

export const getResetAddressesKeysV2 = async ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    preAuthKTVerify,
}: {
    addresses: Address[];
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
    preAuthKTVerify: PreAuthKTVerify;
}): Promise<
    | { userKeyPayload: string; addressKeysPayload: AddressKeyPayloadV2[]; onSKLPublishSuccess: OnSKLPublishSuccess }
    | { userKeyPayload: undefined; addressKeysPayload: undefined; onSKLPublishSuccess: undefined }
> => {
    if (!addresses.length) {
        return { userKeyPayload: undefined, addressKeysPayload: undefined, onSKLPublishSuccess: undefined };
    }
    const { privateKey: userKey, privateKeyArmored: userKeyPayload } = await generateUserKey({
        passphrase,
        encryptionConfig,
    });

    const keyTransparencyVerify = preAuthKTVerify([
        { ID: userKey.getKeyID(), privateKey: userKey, publicKey: userKey },
    ]);

    const addressKeysPayloadWithOnSKLPublish = await Promise.all(
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

            const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                getNormalizedActiveKeys(address, [newPrimaryKey]),
                address,
                keyTransparencyVerify
            );
            return {
                addressKeyPayload: {
                    AddressID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList: signedKeyList,
                    Token: encryptedToken,
                    Signature: signature,
                },
                onSKLPublishSuccess,
            };
        })
    );
    const addressKeysPayload = addressKeysPayloadWithOnSKLPublish.map(({ addressKeyPayload }) => addressKeyPayload);
    const onSKLPublishSuccessAll = async () => {
        await Promise.all(addressKeysPayloadWithOnSKLPublish.map(({ onSKLPublishSuccess }) => onSKLPublishSuccess()));
    };
    return { userKeyPayload, addressKeysPayload, onSKLPublishSuccess: onSKLPublishSuccessAll };
};
