import {
    KEY_LENGTH_BYTES,
    generateKey,
    decryptData as genericDecryptData,
    encryptData as genericEncryptData,
    importKey,
} from '@protontech/crypto/subtle/aesGcm.ts';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import type { PassEncryptionTag } from '../../../types';

export { generateKey, importKey as importSymmetricKey, KEY_LENGTH_BYTES };

export const encryptData = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>, tag: PassEncryptionTag) =>
    genericEncryptData(key, data, utf8StringToUint8Array(tag));

export const decryptData = async (key: CryptoKey, data: Uint8Array<ArrayBuffer>, tag: PassEncryptionTag) =>
    genericDecryptData(key, data, utf8StringToUint8Array(tag));
