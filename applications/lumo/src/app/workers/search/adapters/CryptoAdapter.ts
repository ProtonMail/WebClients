import type { AesGcmCryptoKey } from '../../../crypto/types';
import { deriveSearchIndexDek } from '../../../crypto';

export interface CryptoAdapter {
    setSearchIndexKey(searchIndexKeyBase64: string): void;
    deriveSearchDek(): Promise<CryptoKey>;
    encrypt(data: Uint8Array<ArrayBuffer>, key: CryptoKey, ad?: string): Promise<string>;
    decrypt(
        encrypted: string | Uint8Array<ArrayBuffer>,
        key: CryptoKey,
        ad: string
    ): Promise<Uint8Array<ArrayBuffer>>;
}

/**
 * Crypto adapter that derives the search index DEK from the search index key
 * using the same HKDF pattern as space DEK derivation.
 * 
 * The search index key should be:
 * 1. Generated once per user
 * 2. Wrapped with the master key and stored
 * 3. Passed to this adapter after being unwrapped
 */
export class LumoCryptoAdapter implements CryptoAdapter {
    private searchIndexKeyBytes: Uint8Array<ArrayBuffer> | null = null;
    private cachedDek: CryptoKey | null = null;

    constructor(
        private encryptFn: (data: Uint8Array<ArrayBuffer>, key: AesGcmCryptoKey, ad?: string) => Promise<string>,
        private decryptFn: (data: string, key: AesGcmCryptoKey, ad: string) => Promise<Uint8Array<ArrayBuffer>>
    ) {}

    setSearchIndexKey(searchIndexKeyBase64: string): void {
        this.searchIndexKeyBytes = Uint8Array.fromBase64(searchIndexKeyBase64);
        this.cachedDek = null; // Clear cache when key changes
    }

    async deriveSearchDek(): Promise<CryptoKey> {
        if (this.cachedDek) {
            return this.cachedDek;
        }

        if (!this.searchIndexKeyBytes) {
            throw new Error('Search index key not set. Call setSearchIndexKey() before deriving DEK.');
        }

        const dek = await deriveSearchIndexDek(this.searchIndexKeyBytes);
        this.cachedDek = dek.encryptKey;
        return this.cachedDek;
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

