import { utf8StringToUint8Array } from '@proton/crypto/lib/utils';

import { getDecryptedBlob, getDecryptedBlobV3, getEncryptedBlob, getEncryptedBlobV3 } from '../sessionBlobCryptoHelper';
import type { ForkPayloadVersion } from './constants';

export type ForkEncryptedBlob =
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

export const getForkEncryptedBlob = async (
    key: CryptoKey,
    data: ForkEncryptedBlob,
    payloadVersion: ForkPayloadVersion
) => {
    if (payloadVersion === 3) {
        return getEncryptedBlobV3(key, JSON.stringify(data), utf8StringToUint8Array('fork'));
    }
    return getEncryptedBlob(
        key,
        JSON.stringify(data),
        payloadVersion === 2 ? utf8StringToUint8Array('fork') : undefined
    );
};

const getForkDecryptedBlobData = (key: CryptoKey, data: string, payloadVersion: ForkPayloadVersion) => {
    if (payloadVersion === 3) {
        return getDecryptedBlobV3(key, data, utf8StringToUint8Array('fork'));
    }
    return getDecryptedBlob(key, data, payloadVersion === 2 ? utf8StringToUint8Array('fork') : undefined);
};

export const getForkDecryptedBlob = async (
    key: CryptoKey,
    data: string,
    payloadVersion: ForkPayloadVersion
): Promise<ForkEncryptedBlob | undefined> => {
    const string = await getForkDecryptedBlobData(key, data, payloadVersion);
    const parsedValue: ForkEncryptedBlob = JSON.parse(string);

    const keyPassword = parsedValue.keyPassword ?? '';

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
