import {
    type PrivateKeyReference,
    type PrivateKeyReferenceV4,
    type PrivateKeyReferenceV6,
    toPublicKeyReference,
} from '@proton/crypto';

import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, KEYGEN_TYPES } from '../constants';
import type { ActiveAddressKeysByVersion, ActiveKey } from '../interfaces';
import {
    type Address,
    type AddressKeyPayloadV2,
    type KeyGenConfig,
    type PreAuthKTVerify,
    isActiveKeyV6,
} from '../interfaces';
import { generateAddressKey, generateAddressKeyTokens } from './addressKeys';
import { getActiveKeyObject, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { getDefaultKeyFlags } from './keyFlags';
import type { OnSKLPublishSuccess } from './signedKeyList';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';
import { generateUserKey } from './userKeys';

export interface ResetAddressKeysPayload {
    privateKeys: {
        userKey: PrivateKeyReference;
        addressKeys: { privateKey: PrivateKeyReference; addressID: string }[];
    };
    userKeyPayload: string;
    addressKeysPayload: AddressKeyPayloadV2[];
    onSKLPublishSuccess: OnSKLPublishSuccess;
}

export const getResetAddressesKeysV2 = async ({
    addresses = [],
    passphrase = '',
    supportV6Keys,
    keyGenConfigForV4Keys = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
    preAuthKTVerify,
}: {
    addresses: Address[];
    passphrase: string;
    supportV6Keys: boolean;
    keyGenConfigForV4Keys?: KeyGenConfig; // no option for v6
    preAuthKTVerify: PreAuthKTVerify;
}): Promise<ResetAddressKeysPayload | { [P in keyof ResetAddressKeysPayload]: undefined }> => {
    if (!addresses.length) {
        return {
            privateKeys: undefined,
            userKeyPayload: undefined,
            addressKeysPayload: undefined,
            onSKLPublishSuccess: undefined,
        };
    }
    const { privateKey: userKey, privateKeyArmored: userKeyPayload } = await generateUserKey({
        passphrase,
        keyGenConfig: supportV6Keys ? KEYGEN_CONFIGS[KEYGEN_TYPES.PQC] : keyGenConfigForV4Keys,
    });

    const keyTransparencyVerify = preAuthKTVerify([
        { ID: userKey.getKeyID(), privateKey: userKey, publicKey: userKey },
    ]);

    const addressKeysPayloadWithOnSKLPublishWithMaybeV6 = await Promise.all(
        addresses.map(async (address) => {
            const { ID: AddressID, Email } = address;

            const generate = async (v6Key: boolean, activeKeys: ActiveAddressKeysByVersion) => {
                const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);

                const { privateKey, privateKeyArmored } = await generateAddressKey({
                    email: Email,
                    passphrase: token,
                    keyGenConfig: v6Key ? KEYGEN_CONFIGS[KEYGEN_TYPES.PQC] : keyGenConfigForV4Keys,
                });
                const publicKey = await toPublicKeyReference(privateKey);
                const newPrimaryKey = (await getActiveKeyObject(privateKey, publicKey, {
                    ID: 'tmp',
                    primary: 1,
                    flags: getDefaultKeyFlags(address),
                })) as ActiveKey<PrivateKeyReferenceV4> | ActiveKey<PrivateKeyReferenceV6>;

                const toNormalize = isActiveKeyV6(newPrimaryKey)
                    ? { v4: activeKeys.v4, v6: [newPrimaryKey, ...activeKeys.v6] }
                    : { v4: [newPrimaryKey, ...activeKeys.v4], v6: activeKeys.v6 };

                const newActiveKeys = getNormalizedActiveAddressKeys(address, toNormalize);
                const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                    newActiveKeys,
                    address,
                    keyTransparencyVerify
                );

                return {
                    newActiveKeys,
                    addressKey: {
                        privateKey,
                        addressID: AddressID,
                    },
                    addressKeyPayload: {
                        AddressID,
                        PrivateKey: privateKeyArmored,
                        SignedKeyList: signedKeyList,
                        Token: encryptedToken,
                        Signature: signature,
                    },
                    onSKLPublishSuccess,
                };
            };

            const v4KeyData = await generate(false, { v4: [], v6: [] });
            return supportV6Keys ? [v4KeyData, await generate(true, v4KeyData.newActiveKeys)] : [v4KeyData];
        })
    );

    const addressKeysPayloadWithOnSKLPublish = addressKeysPayloadWithOnSKLPublishWithMaybeV6.flat();
    const addressKeysPayload = addressKeysPayloadWithOnSKLPublish.map(({ addressKeyPayload }) => addressKeyPayload);
    const privateKeys = {
        userKey,
        addressKeys: addressKeysPayloadWithOnSKLPublish.map(({ addressKey }) => addressKey),
    };
    const onSKLPublishSuccessAll = async () => {
        await Promise.all(addressKeysPayloadWithOnSKLPublish.map(({ onSKLPublishSuccess }) => onSKLPublishSuccess()));
    };
    return { privateKeys, userKeyPayload, addressKeysPayload, onSKLPublishSuccess: onSKLPublishSuccessAll };
};
