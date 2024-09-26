import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { KT_SKL_SIGNING_CONTEXT } from '@proton/key-transparency/lib';
import isTruthy from '@proton/utils/isTruthy';

import { getIsAddressDisabled } from '../helpers/address';
import type {
    ActiveKey,
    Address,
    Api,
    DecryptedKey,
    KeyMigrationKTVerifier,
    KeyTransparencyVerify,
    SignedKeyList,
    SignedKeyListItem,
} from '../interfaces';
import type { SimpleMap } from '../interfaces/utils';
import { getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';

export const getSignedKeyListSignature = async (data: string, signingKey: PrivateKeyReference, date?: Date) => {
    const signature = await CryptoProxy.signMessage({
        textData: data,
        stripTrailingSpaces: true,
        signingKeys: [signingKey],
        detached: true,
        context: KT_SKL_SIGNING_CONTEXT,
        date,
    });
    return signature;
};

export type OnSKLPublishSuccess = () => Promise<void>;

/**
 * Generate the signed key list data and verify it for later commit to Key Transparency.
 * The SKL is only considered in the later commit call if the returned OnSKLPublishSuccess closure
 * has been called beforehand.
 */
export const getSignedKeyListWithDeferredPublish = async (
    keys: ActiveKey[],
    address: Address,
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<[SignedKeyList, OnSKLPublishSuccess]> => {
    const transformedKeys = (
        await Promise.all(
            keys.map(async ({ privateKey, flags, primary, sha256Fingerprints, fingerprint }) => {
                const result = await CryptoProxy.isE2EEForwardingKey({ key: privateKey });

                if (result) {
                    return false;
                }

                return {
                    Primary: primary,
                    Flags: flags,
                    Fingerprint: fingerprint,
                    SHA256Fingerprints: sha256Fingerprints,
                };
            })
        )
    ).filter(isTruthy);
    const data = JSON.stringify(transformedKeys);
    const signingKey = keys[0]?.privateKey;
    if (!signingKey) {
        throw new Error('Missing primary signing key');
    }

    // TODO: Could be filtered as well
    const publicKeys = keys.map((key) => key.publicKey);

    const signedKeyList: SignedKeyList = {
        Data: data,
        Signature: await getSignedKeyListSignature(data, signingKey),
    };
    const onSKLPublish = async () => {
        if (!getIsAddressDisabled(address)) {
            await keyTransparencyVerify(address, signedKeyList, publicKeys);
        }
    };
    return [signedKeyList, onSKLPublish];
};

/**
 * Generate the signed key list data and verify it for later commit to Key Transparency
 */
export const getSignedKeyList = async (
    keys: ActiveKey[],
    address: Address,
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<SignedKeyList> => {
    const activeKeysWithoutForwarding = (
        await Promise.all(
            keys.map(async (key) => {
                const result = await CryptoProxy.isE2EEForwardingKey({ key: key.privateKey });
                return result ? false : key;
            })
        )
    ).filter(isTruthy);

    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        activeKeysWithoutForwarding,
        address,
        keyTransparencyVerify
    );
    await onSKLPublishSuccess();
    return signedKeyList;
};

export const createSignedKeyListForMigration = async ({
    address,
    decryptedKeys,
    keyMigrationKTVerifier,
    keyTransparencyVerify,
    api,
}: {
    api: Api;
    address: Address;
    decryptedKeys: DecryptedKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}): Promise<[SignedKeyList | undefined, OnSKLPublishSuccess | undefined]> => {
    let signedKeyList: SignedKeyList | undefined;
    let onSKLPublishSuccess: OnSKLPublishSuccess | undefined;
    if (!address.SignedKeyList || address.SignedKeyList.ObsolescenceToken) {
        // Only create a new signed key list if the address does not have one already
        // or the signed key list is obsolete.
        await keyMigrationKTVerifier({ email: address.Email, signedKeyList: address.SignedKeyList, api });
        const activeKeys = getNormalizedActiveKeys(
            address,
            await getActiveKeys(address, address.SignedKeyList, address.Keys, decryptedKeys)
        );
        if (activeKeys.length > 0) {
            [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                activeKeys,
                address,
                keyTransparencyVerify
            );
        }
    }
    return [signedKeyList, onSKLPublishSuccess];
};

const signedKeyListItemParser = ({ Primary, Flags, Fingerprint, SHA256Fingerprints }: any) =>
    (Primary === 0 || Primary === 1) &&
    typeof Flags === 'number' &&
    typeof Fingerprint === 'string' &&
    Array.isArray(SHA256Fingerprints) &&
    SHA256Fingerprints.every((fingerprint) => typeof fingerprint === 'string');

export const getParsedSignedKeyList = (data?: string | null): SignedKeyListItem[] | undefined => {
    if (!data) {
        return;
    }
    try {
        const parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) {
            return;
        }
        if (!parsedData.every(signedKeyListItemParser)) {
            return;
        }
        return parsedData;
    } catch (e: any) {
        return undefined;
    }
};

export const getSignedKeyListMap = (signedKeyListData?: SignedKeyListItem[]): SimpleMap<SignedKeyListItem> => {
    if (!signedKeyListData) {
        return {};
    }
    return signedKeyListData.reduce<SimpleMap<SignedKeyListItem>>((acc, cur) => {
        acc[cur.Fingerprint] = cur;
        return acc;
    }, {});
};
