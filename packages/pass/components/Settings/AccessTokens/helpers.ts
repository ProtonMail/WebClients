import { CryptoProxy } from '@proton/crypto';
import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import type { PersonalAccessTokenShareKey } from '@proton/pass/lib/access-token/access-token.types';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { uint8ArrayToB64, uint8ArrayToB64URL } from '@proton/pass/utils/buffer/sanitization';

export const PAT_PRODUCT = 'pass';

export const EXPIRING_SOON_THRESHOLD = 3600;

export const getExpirationTimestampFromMinutes = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

export const formatDate = (unixTs: number) =>
    new Date(unixTs * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

export const getDaysRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 86400);
};

export const getHoursRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 3600);
};

export type TokenStatus = 'active' | 'expiring' | 'expired';

export const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = Math.floor(Date.now() / 1000);
    if (expireTime < now) return 'expired';
    if (expireTime - now < EXPIRING_SOON_THRESHOLD) return 'expiring';
    return 'active';
};

export type BuiltPersonalAccessTokenKey = {
    /** OpenPGP-encrypted+signed token key, base64 encoded — sent to the server */
    encrypted: string;
    /** Raw 32-byte token key — must be given to the user together with the token
     * so the CLI can decrypt Pass items. The server never sees this value. */
    raw: Uint8Array<ArrayBuffer>;
};

/** Mirrors the Pass CLI rust implementation:
 * encrypts the raw 32-byte token key with the user's primary public key
 * and signs it with the primary private key. */
export async function buildPersonalAccessTokenKey(
    publicKey: PublicKeyReference,
    privateKey: PrivateKeyReference
): Promise<BuiltPersonalAccessTokenKey> {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await CryptoProxy.encryptMessage({
        binaryData: raw,
        encryptionKeys: publicKey,
        signingKeys: privateKey,
        format: 'binary',
    });
    return { encrypted: encrypted.message.toBase64(), raw };
}

/** Decrypts a stored PAT key (as returned in the list endpoint's
 * `PersonalAccessTokenKey` field) back to its raw 32 bytes, verifying the
 * signature produced at creation time. */
export async function decryptPersonalAccessTokenKey(
    encryptedB64: string,
    privateKey: PrivateKeyReference,
    publicKey: PublicKeyReference
): Promise<Uint8Array<ArrayBuffer>> {
    const binaryMessage = Uint8Array.fromBase64(encryptedB64) as Uint8Array<ArrayBuffer>;
    const { data } = await CryptoProxy.decryptMessage({
        binaryMessage,
        decryptionKeys: privateKey,
        verificationKeys: publicKey,
        format: 'binary',
    });
    return data as Uint8Array<ArrayBuffer>;
}

/** Encodes a raw byte array as URL-safe base64 without padding — matches the
 * rust CLI's `base64::engine::general_purpose::URL_SAFE_NO_PAD.encode`. */
const rawKeyToUrlSafeB64 = (raw: Uint8Array<ArrayBuffer>): string => uint8ArrayToB64URL(raw);

/** The string a user pastes into the Pass CLI (or its env var).
 * Format: `<server-issued-token>::<urlsafe-base64-no-pad(raw-key)>` */
export const buildAccessTokenEnvVar = (token: string, rawKey: Uint8Array<ArrayBuffer>): string =>
    `${token}::${rawKeyToUrlSafeB64(rawKey)}`;

/** Wraps every rotation of a vault's share keys with the PAT's raw symmetric
 * key so the holder of the PAT can decrypt items in that vault. Mirrors the
 * Pass CLI rust `prepare_vault_access_keys` (AES-GCM, AAD=ShareKey). */
export const buildPersonalAccessTokenShareKeys = async (
    rawPatKey: Uint8Array<ArrayBuffer>,
    shareId: string
): Promise<PersonalAccessTokenShareKey[]> => {
    const patKey = await importSymmetricKey(rawPatKey);
    const shareKeys = PassCrypto.getShareManager(shareId).getVaultShareKeys();

    return Promise.all(
        shareKeys.map(async ({ raw, rotation }) => ({
            KeyRotation: rotation,
            Key: uint8ArrayToB64(await encryptData(patKey, raw, PassEncryptionTag.ShareKey)),
        }))
    );
};
