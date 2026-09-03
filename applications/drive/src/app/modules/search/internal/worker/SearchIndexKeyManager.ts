import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { generateKey, importKey } from '../shared/SearchCrypto';
import type { SearchDB } from '../shared/SearchDB';
import { MissingUserKeyEncryptionError, classifyPermanentError, sendErrorReportForSearch } from '../shared/errors';

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

        // Clear before storing, not after. These are two separate transactions, so if we die in
        // between (tab closed, crash) we'd be left with the new key sitting next to blobs only the
        // old key could read - and the next boot decrypts the key fine, returns early above, and
        // never clears them. This way round an interruption just means no key was stored yet, so
        // the next boot regenerates and clears again.
        await db.clearIndex();

        try {
            await db.putSearchCryptoKey(base64Key, encrypt);
        } catch (e) {
            throw classifyPermanentError(e) !== null ? e : new MissingUserKeyEncryptionError(e);
        }

        return { cryptoKey: await importKey(rawKeyBytes) };
    }
}
