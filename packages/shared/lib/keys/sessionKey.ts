import type { SessionKey } from '@proton/crypto';

import { AES256 } from '../constants';

export const toSessionKey = (decryptedKeyPacket: string): SessionKey => {
    return { algorithm: AES256, data: Uint8Array.fromBase64(decryptedKeyPacket) };
};
