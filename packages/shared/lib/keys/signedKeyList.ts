import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { KT_SKL_SIGNING_CONTEXT } from '@proton/key-transparency/lib';

import {
    ActiveKey,
    Address,
    DecryptedKey,
    KeyTransparencyVerify,
    SignedKeyList,
    SignedKeyListItem,
} from '../interfaces';
import { SimpleMap } from '../interfaces/utils';
import { getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';

export const getSignedKeyListSignature = async (data: string, signingKey: PrivateKeyReference) => {
    const signature = await CryptoProxy.signMessage({
        textData: data,
        stripTrailingSpaces: true,
        signingKeys: [signingKey],
        detached: true,
        context: KT_SKL_SIGNING_CONTEXT,
    });
    return signature;
};

/**
 * Generate the signed key list data and verify it for later commit to Key Transparency
 */
export const getSignedKeyList = async (
    keys: ActiveKey[],
    address: Address,
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<SignedKeyList> => {
    const transformedKeys = await Promise.all(
        keys.map(async ({ flags, primary, sha256Fingerprints, fingerprint }) => ({
            Primary: primary,
            Flags: flags,
            Fingerprint: fingerprint,
            SHA256Fingerprints: sha256Fingerprints,
        }))
    );
    const data = JSON.stringify(transformedKeys);
    const signingKey = keys[0]?.privateKey;
    if (!signingKey) {
        throw new Error('Missing primary signing key');
    }

    const publicKeys = keys.map((key) => key.publicKey);

    const signedKeyList: SignedKeyList = {
        Data: data,
        Signature: await getSignedKeyListSignature(data, signingKey),
    };

    await keyTransparencyVerify(address, signedKeyList, publicKeys);

    return signedKeyList;
};

export const getOrCreateSignedKeyList = async (
    address: Address,
    decryptedKeys: DecryptedKey[],
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<SignedKeyList | undefined> => {
    if (address.SignedKeyList) {
        return {
            Data: address.SignedKeyList.Data,
            Signature: address.SignedKeyList.Signature,
        };
    }
    const activeKeys = getNormalizedActiveKeys(
        address,
        await getActiveKeys(address, address.SignedKeyList, address.Keys, decryptedKeys)
    );
    return activeKeys.length > 0 ? getSignedKeyList(activeKeys, address, keyTransparencyVerify) : undefined;
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
