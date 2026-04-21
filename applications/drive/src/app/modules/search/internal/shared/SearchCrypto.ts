import { decryptData, encryptData, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

import type { IndexKind } from './types';

export { generateKey, importKey };

/** Shared encoder instance used to convert AAD strings to bytes. */
const textEncoder = new TextEncoder();

/**
 * Builds the AES-GCM additional authenticated data (AAD) for a blob.
 * Binds the ciphertext to a specific index kind and blob name so that
 * encrypted blobs cannot be swapped or replayed across indexes.
 */
export function blobAdditionalData(indexKind: IndexKind, blobName: string): Uint8Array<ArrayBuffer> {
    return textEncoder.encode(`drive.search.blob.${indexKind}.${blobName}`);
}

/** Encrypts a serialized blob with AES-GCM, authenticated against its index kind and name. */
export async function encryptBlob(
    cryptoKey: CryptoKey,
    data: Uint8Array<ArrayBuffer>,
    indexKind: IndexKind,
    blobName: string
): Promise<ArrayBuffer> {
    const ad = blobAdditionalData(indexKind, blobName);
    const encrypted = await encryptData(cryptoKey, data, ad);
    return encrypted.buffer;
}

/** Decrypts an AES-GCM encrypted blob, verifying its index kind and name via AAD. */
export async function decryptBlob(
    cryptoKey: CryptoKey,
    raw: ArrayBuffer,
    indexKind: IndexKind,
    blobName: string
): Promise<Uint8Array<ArrayBuffer>> {
    const ad = blobAdditionalData(indexKind, blobName);
    return decryptData(cryptoKey, new Uint8Array(raw) as Uint8Array<ArrayBuffer>, ad);
}
