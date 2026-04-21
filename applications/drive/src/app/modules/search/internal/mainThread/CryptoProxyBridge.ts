import { CryptoProxy } from '@proton/crypto';
import { DRIVE_SIGNATURE_CONTEXT } from '@proton/shared/lib/drive/constants';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { MissingUserKeyEncryptionError } from '../shared/errors';

/**
 * Proxies OpenPGP encrypt/decrypt operations to the main thread where CryptoProxy is available.
 * Passed to the SharedWorker via Comlink so the worker can wrap/unwrap keys.
 */
export class CryptoProxyBridge {
    constructor(private readonly getUserKeys: () => Promise<DecryptedKey[]>) {
        this.openpgpEncryptIndexKey = this.openpgpEncryptIndexKey.bind(this);
        this.openpgpDecryptIndexKey = this.openpgpDecryptIndexKey.bind(this);
    }

    /**
     * OpenPGP-encrypt the search index key using the user's primary key.
     * The plaintext is a base64-encoded AES-GCM key.
     */
    async openpgpEncryptIndexKey(plaintext: string): Promise<string> {
        const userKeys = await this.getUserKeys();
        const primaryKey = userKeys[0];

        if (!primaryKey) {
            // TODO: Exception hardening, convert to permanent error.
            throw new MissingUserKeyEncryptionError();
        }

        const { message } = await CryptoProxy.encryptMessage({
            textData: plaintext,
            encryptionKeys: [primaryKey.publicKey],
            signingKeys: [primaryKey.privateKey],
            signatureContext: { value: DRIVE_SIGNATURE_CONTEXT.SEARCH_INDEX, critical: true },
        });
        return message;
    }

    /**
     * OpenPGP-decrypt a previously wrapped search index key.
     * Returns the base64-encoded AES-GCM key material.
     */
    async openpgpDecryptIndexKey(armoredMessage: string): Promise<string> {
        const userKeys = await this.getUserKeys();

        if (userKeys.length === 0) {
            // TODO: Exception hardening, convert to permanent error.
            throw new MissingUserKeyEncryptionError();
        }

        const { data } = await CryptoProxy.decryptMessage({
            armoredMessage,
            verificationKeys: userKeys.map(({ publicKey }) => publicKey),
            decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
            signatureContext: { value: DRIVE_SIGNATURE_CONTEXT.SEARCH_INDEX, required: true },
            expectSigned: true,
        });
        return data;
    }
}
