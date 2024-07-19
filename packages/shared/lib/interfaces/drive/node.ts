import type { PrivateKeyReference, SessionKey } from '@proton/crypto';

export interface NodeKeys {
    privateKey: PrivateKeyReference;
    sessionKey?: SessionKey;
}
