import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenLinkKeyParams = {
    encryptedLinkKey: string;
    key: CryptoKey;
};

export const openLinkKey = async ({ encryptedLinkKey, key }: OpenLinkKeyParams): Promise<Uint8Array<ArrayBuffer>> =>
    decryptData(key, base64StringToUint8Array(encryptedLinkKey), PassEncryptionTag.LinkKey);
