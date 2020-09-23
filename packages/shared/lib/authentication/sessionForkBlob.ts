import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

interface ForkEncryptedBlob {
    keyPassword: string;
}
export const getForkEncryptedBlob = async (key: CryptoKey, data: ForkEncryptedBlob) => {
    return getEncryptedBlob(key, JSON.stringify(data));
};

export const getForkDecryptedBlob = async (key: CryptoKey, data: string): Promise<ForkEncryptedBlob | undefined> => {
    const string = await getDecryptedBlob(key, data);
    const parsedValue = JSON.parse(string);
    return {
        keyPassword: parsedValue.keyPassword || '',
    };
};
