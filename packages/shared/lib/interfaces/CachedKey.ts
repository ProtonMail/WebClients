import { OpenPGPKey } from 'pmcrypto';
import { Key } from './Key';

export interface CachedKey {
    Key: Key;
    // Can be undefined if the key was not parsed, not decrypted or invalid
    privateKey?: OpenPGPKey;
    publicKey?: OpenPGPKey;
    error?: Error;
}
