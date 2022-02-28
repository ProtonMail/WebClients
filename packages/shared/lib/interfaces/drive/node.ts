import { OpenPGPKey, SessionKey } from 'pmcrypto';

export interface NodeKeys {
    privateKey: OpenPGPKey;
    sessionKey?: SessionKey;
}
