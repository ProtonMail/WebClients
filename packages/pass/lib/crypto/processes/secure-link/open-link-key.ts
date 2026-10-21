import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import { decryptData } from '../../utils/crypto-helpers';

type OpenLinkKeyParams = {
    encryptedLinkKey: string;
    key: CryptoKey;
};

export const openLinkKey = async ({ encryptedLinkKey, key }: OpenLinkKeyParams): Promise<Uint8Array<ArrayBuffer>> =>
    decryptData(key, Uint8Array.fromBase64(encryptedLinkKey), PassEncryptionTag.LinkKey);
