import { CryptoProxy } from '@protontech/crypto';
import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { generateKey as generateAESKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { IDBPDatabase } from 'idb';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { Database } from '../db/schema';

const MAIL_SIGNATURE_CONTEXT = {
    SEARCH_INDEX: 'mail.search.index',
};

/**
 * OpenPGP-encrypt the search index key using the user's primary key.
 * The plaintext is a base64-encoded AES-GCM key.
 */
async function encryptKey(aesKeyBytes: Uint8Array<ArrayBuffer>, userKeys: DecryptedKey[]): Promise<string> {
    const primaryKey = userKeys[0];

    if (!primaryKey) {
        throw new Error('no primary user key');
    }

    const { message } = await CryptoProxy.encryptMessage({
        binaryData: aesKeyBytes,
        encryptionKeys: [primaryKey.publicKey],
        signingKeys: [primaryKey.privateKey],
        signatureContext: { value: MAIL_SIGNATURE_CONTEXT.SEARCH_INDEX, critical: true },
    });
    return message;
}

/**
 * OpenPGP-decrypt a previously wrapped search index key.
 * Returns the raw AES-GCM key bytes.
 */
async function decryptKey(armoredOpenPGPMessage: string, userKeys: DecryptedKey[]): Promise<Uint8Array<ArrayBuffer>> {
    if (userKeys.length === 0) {
        throw new Error('no user keys');
    }

    const { data: keyBytes } = await CryptoProxy.decryptMessage({
        armoredMessage: armoredOpenPGPMessage,
        verificationKeys: userKeys.map(({ publicKey }) => publicKey),
        decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
        signatureContext: { value: MAIL_SIGNATURE_CONTEXT.SEARCH_INDEX, required: true },
        expectSigned: true,
        format: 'binary',
    });
    return keyBytes;
}

async function decryptAndImportKey(armoredOpenPGPMessage: string, userKeys: DecryptedKey[]): Promise<AesGcmCryptoKey> {
    const keyBytes = await decryptKey(armoredOpenPGPMessage, userKeys);
    return importKey(keyBytes);
}

async function generateKey(db: IDBPDatabase<Database>, userKeys: DecryptedKey[]): Promise<AesGcmCryptoKey> {
    const keyBytes = generateAESKey();
    const encryptedKey = await encryptKey(keyBytes, userKeys);
    const txn = db.transaction('config', 'readwrite');
    // check again the key doesn't exist now we have the write txn open
    const existingKeyString = await txn.store.get('indexKey');
    if (!existingKeyString) {
        void txn.store.put(encryptedKey, 'indexKey');
        await txn.done;
        return importKey(keyBytes);
    } else {
        // decrypt and return the existing key
        return decryptAndImportKey(existingKeyString, userKeys);
    }
}

async function readKey(db: IDBPDatabase<Database>, userKeys: DecryptedKey[]): Promise<AesGcmCryptoKey | undefined> {
    const keyString = await db.get('config', 'indexKey');
    if (!keyString) {
        return undefined;
    }
    return decryptAndImportKey(keyString, userKeys);
}

export async function getOrGenerateIndexKey(db: IDBPDatabase<Database>, userKeys: DecryptedKey[]): Promise<AesGcmCryptoKey> {
    let key = await readKey(db, userKeys);
    if (!key) {
        key = await generateKey(db, userKeys);
    }
    return key;
}

export async function getIndexKey(
    db: IDBPDatabase<Database>,
    userKeys: DecryptedKey[]
): Promise<AesGcmCryptoKey | undefined> {
    return readKey(db, userKeys);
}
