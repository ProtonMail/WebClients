import { signMessage } from 'pmcrypto';

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

const getPrimaryKey = (keys) => {
    return keys.find(({ Key: { Primary } }) => {
        return Primary === 1;
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
