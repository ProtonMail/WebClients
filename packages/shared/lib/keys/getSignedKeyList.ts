import { OpenPGPKey, signMessage } from 'pmcrypto';
import { SignedKeyList, KeyAction } from '../interfaces';

export const getSignature = async (data: string, signingKey: OpenPGPKey) => {
    const { signature } = await signMessage({
        data,
        privateKeys: [signingKey],
        armor: true,
        detached: true,
    });
    return `${signature}`;
};

const transformKeysOutput = (keys: KeyAction[]) => {
    return keys.map(({ primary, flags, fingerprint }) => {
        return {
            Primary: primary,
            Flags: flags,
            Fingerprint: fingerprint,
        };
    });
};

/**
 * Generate the signed key list data
 * @param keys - The list of keys
 * @param signingKey - The primary key of the list
 */
const getSignedKeyList = async (keys: KeyAction[], signingKey: OpenPGPKey): Promise<SignedKeyList> => {
    const data = JSON.stringify(transformKeysOutput(keys));
    return {
        Data: data,
        Signature: await getSignature(data, signingKey),
    };
};

export default getSignedKeyList;
