import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { computeSHA256 } from '@proton/crypto/lib/subtle/hash';

import type { AesGcmCryptoKey } from '../../../crypto/types';

export interface CryptoAdapter {
    deriveSearchKey(userId: string): Promise<CryptoKey>;
    encrypt(data: Uint8Array<ArrayBuffer>, key: CryptoKey, ad?: string): Promise<string>;
    decrypt(
        encrypted: string | Uint8Array<ArrayBuffer>,
        key: CryptoKey,
        ad: string
    ): Promise<Uint8Array<ArrayBuffer>>;
}

/**
 * Crypto adapter that derives a deterministic per-user search key and reuses
 * the existing crypto helpers to encrypt/decrypt blobs stored in IndexedDB.
 */
export class LumoCryptoAdapter implements CryptoAdapter {
    constructor(
        private encryptFn: (data: Uint8Array<ArrayBuffer>, key: AesGcmCryptoKey, ad?: string) => Promise<string>,
        private decryptFn: (data: string, key: AesGcmCryptoKey, ad: string) => Promise<Uint8Array<ArrayBuffer>>
    ) {}

    async deriveSearchKey(userId: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const material = encoder.encode(`lumo-foundation-search:${userId}`);
        const hash = await computeSHA256(material);

        return importKey(hash);
    }

    async encrypt(data: Uint8Array<ArrayBuffer>, key: CryptoKey, ad?: string): Promise<string> {
        return this.encryptFn(data, { encryptKey: key } as AesGcmCryptoKey, ad);
    }

    async decrypt(
        encrypted: string | Uint8Array<ArrayBuffer>,
        key: CryptoKey,
        ad: string
    ): Promise<Uint8Array<ArrayBuffer>> {
        const encryptedString = typeof encrypted === 'string' ? encrypted : encrypted.toBase64();
        return this.decryptFn(encryptedString, { encryptKey: key } as AesGcmCryptoKey, ad);
    }
}

