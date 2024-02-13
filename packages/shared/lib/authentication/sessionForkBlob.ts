import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

interface ForkEncryptedBlob {
    keyPassword: string;
}
export const getForkEncryptedBlob = async (key: CryptoKey, data: ForkEncryptedBlob, version: 1 | 2) => {
    return getEncryptedBlob(key, JSON.stringify(data), version === 2 ? stringToUint8Array('fork') : undefined);
};

export const getForkDecryptedBlob = async (
    key: CryptoKey,
    data: string,
    version: 1 | 2
): Promise<ForkEncryptedBlob | undefined> => {
    const string = await getDecryptedBlob(key, data, version === 2 ? stringToUint8Array('fork') : undefined);
    const parsedValue = JSON.parse(string);
    return {
        keyPassword: parsedValue.keyPassword || '',
    };
};
