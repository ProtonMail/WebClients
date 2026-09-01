import { CryptoProxy } from '@protontech/crypto';
import {
    type AesGcmCryptoKey,
    decryptData,
    encryptData,
    exportKey,
    generateAndImportKey,
    importKey,
} from '@protontech/crypto/subtle/aesGcm.ts';

import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { GUEST_BACKGROUND_KEY_STORAGE_KEY } from '../constants';
import type { BackgroundField } from '../types';

const getSignatureContext = (field: BackgroundField, recordId: string) => `meet-background.${field}.${recordId}`;

type CypherFunction = (
    field: BackgroundField,
    recordId: string,
    bytes: Uint8Array<ArrayBuffer>
) => Promise<Uint8Array<ArrayBuffer>>;

export interface BackgroundCipher {
    encryptField: CypherFunction;
    decryptField: CypherFunction;
}

/**
 * Fields go straight to the user's own PGP key, so there is no symmetric key of ours to derive, store,
 * rotate or clear. Binary on both sides, never armored: armor is base64 and inflates images by a third.
 */
export const createUserKeyCipher = (userKeys: DecryptedKey[]): BackgroundCipher => {
    const primaryKey = userKeys[0];

    if (!primaryKey) {
        throw new Error('Cannot encrypt custom backgrounds: no user key available');
    }

    return {
        encryptField: async (field, recordId, bytes) => {
            const { message } = await CryptoProxy.encryptMessage({
                binaryData: bytes,
                encryptionKeys: [primaryKey.publicKey],
                signingKeys: [primaryKey.privateKey],
                format: 'binary',
                signatureContext: { value: getSignatureContext(field, recordId), critical: true },
            });

            return message;
        },
        // Every key rather than the primary alone, so records written under a superseded key keep
        // opening. One that opens under none of them is dropped by the caller.
        decryptField: async (field, recordId, ciphertext) => {
            const { data } = await CryptoProxy.decryptMessage({
                binaryMessage: ciphertext,
                decryptionKeys: userKeys.map(({ privateKey }) => privateKey),
                verificationKeys: userKeys.map(({ publicKey }) => publicKey),
                signatureContext: { value: getSignatureContext(field, recordId), required: true },
                expectSigned: true,
                format: 'binary',
            });

            return data;
        },
    };
};

const textEncoder = new TextEncoder();

const guestAdditionalData = (field: BackgroundField, recordId: string): Uint8Array<ArrayBuffer> =>
    textEncoder.encode(getSignatureContext(field, recordId));

/**
 * A guest has no PGP key, so their half stays symmetric. The key lives in session storage, like the
 * unauthenticated session UID itself, so their records survive a reload but not the tab: what is left
 * on disk afterwards can no longer be opened, and is dropped the next time it is read.
 */
const getOrCreateGuestKey = async (): Promise<AesGcmCryptoKey> => {
    const stored = getItem(GUEST_BACKGROUND_KEY_STORAGE_KEY);

    if (stored) {
        try {
            return await importKey(Uint8Array.fromBase64(stored), {
                keyUsage: ['encrypt', 'decrypt'],
                extractable: true,
            });
        } catch {
            // Unusable stored key: mint a fresh one. Records under the old one are dropped on read.
        }
    }

    const key = await generateAndImportKey(['encrypt', 'decrypt']);
    setItem(GUEST_BACKGROUND_KEY_STORAGE_KEY, (await exportKey(key)).toBase64());

    return key;
};

export const createGuestCipher = async (): Promise<BackgroundCipher> => {
    const key = await getOrCreateGuestKey();

    return {
        encryptField: (field, recordId, bytes) => encryptData(key, bytes, guestAdditionalData(field, recordId)),
        decryptField: (field, recordId, ciphertext) =>
            decryptData(key, ciphertext, guestAdditionalData(field, recordId)),
    };
};
