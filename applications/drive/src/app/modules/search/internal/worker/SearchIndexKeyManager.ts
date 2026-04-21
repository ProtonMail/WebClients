import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { generateKey, importKey } from '../shared/SearchCrypto';
import type { SearchDB } from '../shared/SearchDB';
import { sendErrorReportForSearch } from '../shared/errors';

export interface ResolvedKey {
    cryptoKey: CryptoKey;
}

/**
 * Manages the AES-GCM symmetric key used to encrypt search index blobs.
 *
 * Runs in the SharedWorker. OpenPGP wrap/unwrap operations are proxied to the
 * main thread via the bridge (CryptoProxy is only available there).
 *
 * The key is generated once per user, OpenPGP-encrypted, and stored in IndexedDB.
 * On subsequent loads the stored key is decrypted and returned as a CryptoKey.
 */
export class SearchIndexKeyManager {
    /**
     * Returns the AES-GCM CryptoKey for encrypting search index blobs.
     *
     * - First run: generates key, wraps with OpenPGP via bridge, stores in IDB.
     * - Subsequent runs: reads wrapped key from IDB, unwraps via bridge.
     * - If decryption fails (e.g. OpenPGP key rotation): regenerates and clears blobs.
     */
    static async getOrCreateKey(db: SearchDB, bridge: MainThreadBridge): Promise<ResolvedKey> {
        const decrypt = (ciphertext: string) => bridge.cryptoProxyBridge.openpgpDecryptIndexKey(ciphertext);
        const encrypt = (plaintext: string) => bridge.cryptoProxyBridge.openpgpEncryptIndexKey(plaintext);

        try {
            const decryptedBase64 = await db.getSearchCryptoKey(decrypt);
            if (decryptedBase64) {
                const rawBytes = Uint8Array.fromBase64(decryptedBase64) as Uint8Array<ArrayBuffer>;
                return { cryptoKey: await importKey(rawBytes) };
            }
        } catch (e) {
            const error = new Error('failed to OpenPGP-decrypt stored AES-GCM CryptoKey, regenerating', {
                cause: e,
            });
            sendErrorReportForSearch(error.message, error);
            // TODO: Instrument and exception handling hardening
        }

        const rawKeyBytes = generateKey();
        // Encode as base64 because the bridge is a Comlink proxy (string-only serialization).
        const base64Key = rawKeyBytes.toBase64();

        // TODO: Exception handling hardening
        await db.putSearchCryptoKey(base64Key, encrypt);
        // A new key means old blobs are undecryptable — clear stale index data.
        await db.clearIndex();

        return { cryptoKey: await importKey(rawKeyBytes) };
    }
}
