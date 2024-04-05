import { stringToUtf8Array } from '@proton/crypto/lib/utils';

import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

type ForkEncryptedBlob =
    | {
          type: 'default';
          keyPassword: string;
      }
    | {
          type: 'offline';
          keyPassword: string;
          offlineKeyPassword: string;
          offlineKeySalt: string;
      };

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

    const keyPassword = parsedValue.keyPassword || '';

    if (parsedValue.type === 'offline' && parsedValue.offlineKeyPassword && parsedValue.offlineKeySalt) {
        return {
            type: 'offline',
            keyPassword,
            offlineKeySalt: parsedValue.offlineKeySalt,
            offlineKeyPassword: parsedValue.offlineKeyPassword,
        };
    }

    return {
        type: 'default',
        keyPassword,
    };
};
