import { getSHA256Fingerprints, OpenPGPKey, signMessage } from 'pmcrypto';
import { SignedKeyList } from '../interfaces';

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
 * @param keys - The list of keys
 * @param signingKey - The primary key of the list
 */
const getSignedKeyList = async (
    keys: { privateKey: OpenPGPKey; primary: number; flags: number }[],
    signingKey: OpenPGPKey
): Promise<SignedKeyList> => {
    const transformedKeys = await Promise.all(
        keys.map(async ({ privateKey, flags, primary }) => ({
            Primary: primary,
            Flags: flags,
            Fingerprint: privateKey.getFingerprint(),
            SHA256Fingerprints: await getSHA256Fingerprints(privateKey),
        }))
    );
    const data = JSON.stringify(transformedKeys);
    return {
        Data: data,
        Signature: await getSignature(data, signingKey),
    };
};

export default getSignedKeyList;
