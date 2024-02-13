import { stringToUtf8Array } from '@proton/crypto/lib/utils';

import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

interface ForkEncryptedBlob {
    type: 'default';
    keyPassword: string;
}

export const getForkEncryptedBlob = async (key: CryptoKey, data: ForkEncryptedBlob, payloadVersion: 1 | 2) => {
    return getEncryptedBlob(key, JSON.stringify(data), payloadVersion === 2 ? stringToUtf8Array('fork') : undefined);
};

export const getForkDecryptedBlob = async (
    key: CryptoKey,
    data: string,
    payloadVersion: 1 | 2
): Promise<ForkEncryptedBlob | undefined> => {
    const string = await getDecryptedBlob(key, data, payloadVersion === 2 ? stringToUtf8Array('fork') : undefined);
    const parsedValue = JSON.parse(string);
    return {
        type: 'default',
        keyPassword: parsedValue.keyPassword || '',
    };
};
