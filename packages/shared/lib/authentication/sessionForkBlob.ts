import { SessionKey } from 'pmcrypto';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

interface ForkEncryptedBlob {
    keyPassword: string;
}
export const getForkEncryptedBlob = async (sessionKey: SessionKey, data: ForkEncryptedBlob) => {
    return getEncryptedBlob(sessionKey, JSON.stringify(data));
};

export const getForkDecryptedBlob = async (
    sessionKey: SessionKey,
    data: string
): Promise<ForkEncryptedBlob | undefined> => {
    const string = await getDecryptedBlob(sessionKey, data);
    const parsedValue = JSON.parse(string);
    return {
        keyPassword: parsedValue.keyPassword || '',
    };
};
