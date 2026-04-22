import type { PrivateKeyReference, SessionKey } from '@protontech/crypto';

export interface NodeKeys {
    privateKey: PrivateKeyReference;
    sessionKey?: SessionKey;
}
