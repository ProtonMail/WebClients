import { CryptoProxy } from '@protontech/crypto';
import { generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { IDBPDatabase } from 'idb';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { Database } from '../db/schema.ts';

const MAIL_SIGNATURE_CONTEXT = {
    SEARCH_INDEX: 'mail.search.index',
};

export class KeyManager {
    constructor(
        private userKeys: DecryptedKey[],
        private db: IDBPDatabase<Database>
    ) {}

    async getKey(): Promise<CryptoKey> {
        let key = await this.readKey();
        if (!key) {
            key = await this.generateKey();
        }
        return key;
    }

    private async readKey(): Promise<CryptoKey | undefined> {
        const keyString = await this.db.get('config', 'indexKey');
        if (!keyString) {
            return undefined;
        }
        const decryptedKeyString = await this.decryptKey(keyString);
        return importKey(Uint8Array.fromBase64(decryptedKeyString));
    }

    private async generateKey(): Promise<CryptoKey> {
        const keyBytes = generateKey();
        const keyStr = keyBytes.toBase64();
        const encryptedKey = await this.encryptKey(keyStr);
        await this.db.put('config', encryptedKey, 'indexKey');
        return importKey(keyBytes);
    }

    /**
     * OpenPGP-encrypt the search index key using the user's primary key.
     * The plaintext is a base64-encoded AES-GCM key.
     */
    private async encryptKey(plaintext: string): Promise<string> {
        const primaryKey = this.userKeys[0];

        if (!primaryKey) {
            throw new Error('no primary user key');
        }

        const { message } = await CryptoProxy.encryptMessage({
            textData: plaintext,
            encryptionKeys: [primaryKey.publicKey],
            signingKeys: [primaryKey.privateKey],
            signatureContext: { value: MAIL_SIGNATURE_CONTEXT.SEARCH_INDEX, critical: true },
        });
        return message;
    }

    /**
     * OpenPGP-decrypt a previously wrapped search index key.
     * Returns the base64-encoded AES-GCM key material.
     */
    private async decryptKey(armoredMessage: string): Promise<string> {
        if (this.userKeys.length === 0) {
            throw new Error('no user keys');
        }

        const { data } = await CryptoProxy.decryptMessage({
            armoredMessage,
            verificationKeys: this.userKeys.map(({ publicKey }) => publicKey),
            decryptionKeys: this.userKeys.map(({ privateKey }) => privateKey),
            signatureContext: { value: MAIL_SIGNATURE_CONTEXT.SEARCH_INDEX, required: true },
            expectSigned: true,
        });
        return data;
    }
}
