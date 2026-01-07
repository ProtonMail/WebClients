import type { AesGcmCryptoKey } from '@proton/crypto/lib/subtle/aesGcm';
import { deriveKey } from '@proton/crypto/lib/subtle/aesGcm';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { decryptData, encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ExportRequestOptions } from '@proton/pass/lib/export/types';
import { type Maybe, PassEncryptionTag } from '@proton/pass/types';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

export enum ReauthAction {
    BIOMETRICS_SETUP = 'BIOMETRICS_SETUP',
    EXPORT_CONFIRM = 'EXPORT_CONFIRM',
    OFFLINE_SETUP = 'OFFLINE_SETUP',
    PW_LOCK_SETUP = 'PW_LOCK_SETUP',
}

type ReauthLockChange = {
    /** Optional previous secret in order to properly disable the active
     * lock. Will be be stored temporarily in session storage encrypted.
     * NOTE: reauth is only required for lock changes if we do not have
     * an offline password available for local verification, as such, this
     * `current` value is only used when switching from a PIN lock to a
     * password or biometrics lock. */
    current: Maybe<string>;
    ttl: number;
};

type EncryptedReauthPayload = { encrypted: string; salt: string };

export type ReauthActionPayload<T extends ReauthAction = ReauthAction> = Extract<
    | { type: ReauthAction.BIOMETRICS_SETUP; data: ReauthLockChange }
    | { type: ReauthAction.EXPORT_CONFIRM; data: ExportRequestOptions }
    | { type: ReauthAction.OFFLINE_SETUP }
    | { type: ReauthAction.PW_LOCK_SETUP; data: ReauthLockChange },
    { type: T }
>;

/** Checks if the reauth action requires the payload to be encrypted */
export const isLockChangeReauth = (
    payload: ReauthActionPayload
): payload is ReauthActionPayload<ReauthAction.BIOMETRICS_SETUP | ReauthAction.PW_LOCK_SETUP> => {
    const { type } = payload;
    return type === ReauthAction.BIOMETRICS_SETUP || type === ReauthAction.PW_LOCK_SETUP;
};

/** Checks if the reauth action requires password authentication
 * with `promptType=offline` in order to derive offline components */
export const isOfflinePasswordReauth = ({ type }: ReauthActionPayload) =>
    type === ReauthAction.BIOMETRICS_SETUP ||
    type === ReauthAction.OFFLINE_SETUP ||
    type === ReauthAction.PW_LOCK_SETUP;

export const resolveReauthKey = async (
    authStore: AuthStore,
    salt: Uint8Array<ArrayBuffer>
): Promise<AesGcmCryptoKey> => {
    const sessionLockToken = authStore.getLockToken();
    if (!sessionLockToken) throw new Error('Reauth key resolution failure');

    const secret = stringToUint8Array(sessionLockToken);
    const info = stringToUint8Array(PassEncryptionTag.ReauthPayload);
    return deriveKey(secret, salt, info);
};

export const encryptReauthLock = async (payload: ReauthLockChange, authStore: AuthStore): Promise<ReauthLockChange> => {
    if (!payload.current) return payload;

    const salt = crypto.getRandomValues(new Uint8Array(32));
    const key = await resolveReauthKey(authStore, salt);
    const encrypted = await encryptData(key, stringToUint8Array(payload.current), PassEncryptionTag.ReauthPayload);
    const data = { encrypted: encrypted.toBase64(), salt: salt.toBase64() } satisfies EncryptedReauthPayload;
    const current = JSON.stringify(data);

    return { current, ttl: payload.ttl };
};

export const decryptReauthLock = async (payload: ReauthLockChange, authStore: AuthStore): Promise<ReauthLockChange> => {
    if (!payload.current) return payload;

    const data = JSON.parse(payload.current) as EncryptedReauthPayload;
    const salt = Uint8Array.fromBase64(data.salt);
    const encrypted = Uint8Array.fromBase64(data.encrypted);
    const key = await resolveReauthKey(authStore, salt);
    const current = await decryptData(key, encrypted, PassEncryptionTag.ReauthPayload);

    return { current: uint8ArrayToString(current), ttl: payload.ttl };
};
