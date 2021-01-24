import { OpenPGPKey, signMessage } from 'pmcrypto';
import { ActiveKey, SignedKeyList, SignedKeyListItem } from '../interfaces';
import { SimpleMap } from '../interfaces/utils';

export const getSignature = async (data: string, signingKey: OpenPGPKey) => {
    const { signature } = await signMessage({
        data,
        privateKeys: [signingKey],
        armor: true,
        detached: true,
    });
    return `${signature}`;
};

/**
 * Generate the signed key list data
 */
export const getSignedKeyList = async (keys: ActiveKey[]): Promise<SignedKeyList> => {
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
    return {
        Data: data,
        Signature: await getSignature(data, signingKey),
    };
};

export const getParsedSignedKeyList = (data?: string | null): SignedKeyListItem[] | undefined => {
    if (!data) {
        return;
    }
    try {
        const parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) {
            return;
        }
        if (!parsedData.every((data) => Array.isArray(data.SHA256Fingerprints))) {
            return;
        }
        return parsedData;
    } catch (e) {
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
