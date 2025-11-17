import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';

type OpenLinkKeyParams = {
    encryptedLinkKey: string;
    key: CryptoKey;
};

export const openLinkKey = async ({ encryptedLinkKey, key }: OpenLinkKeyParams): Promise<Uint8Array<ArrayBuffer>> =>
    decryptData(key, Uint8Array.fromBase64(encryptedLinkKey), PassEncryptionTag.LinkKey);
