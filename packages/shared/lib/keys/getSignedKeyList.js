import { signMessage } from 'pmcrypto';
import { getPrimaryKey } from './keys';

export const getSignature = async (Data, primaryKey) => {
    const { signature } = await signMessage({
        data: Data,
        privateKeys: [primaryKey],
        armor: true,
        detached: true
    });
    return signature;
};

const transformKeysOutput = (keys) => {
    return keys.map(({ Key: { Primary, Flags }, privateKey }) => {
        return {
            Primary,
            Flags,
            Fingerprint: privateKey.getFingerprint()
        };
    });
};

/**
 * Get the signed key list.
 * @param {Array} keys
 * @return {Promise}
 */
const getSignedKeyList = async (keys) => {
    const data = JSON.stringify(transformKeysOutput(keys));
    const { privateKey } = getPrimaryKey(keys);
    return {
        Data: data,
        Signature: await getSignature(data, privateKey)
    };
};

export default getSignedKeyList;
