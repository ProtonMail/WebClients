import { computeSHA256 } from '@protontech/crypto/subtle/hash.ts';

import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import type { AuthSession, EncryptedSessionKeys } from './session';

type IntegrityKey = keyof Omit<AuthSession, EncryptedSessionKeys>;

export const SESSION_DIGEST_VERSION = 2;
const VERSION_SEPARATOR = '.';

/** `AuthSession` keys used to verify the integrity of the session
 * when resuming from a persisted state. This ensures that the
 * session has not been tampered with, avoiding unintended side-effects
 * if the persisted session was modified outside of our control.
 * ⚠️ WARNING: UPDATING KEYS HERE WILL CAUSE EXISTING DIGESTS TO FAIL
 * VALIDATION - BUMP THE `SESSION_DIGEST_VERSION` WHEN DOING SO.  */
export const SESSION_INTEGRITY_KEYS_V1: IntegrityKey[] = [
    'extraPassword',
    'LocalID',
    'lockMode',
    'lockTTL',
    'offlineVerifier',
    'payloadVersion',
    'persistent',
    'UID',
    'UserID',
];

export const SESSION_INTEGRITY_KEYS_V2: IntegrityKey[] = [...SESSION_INTEGRITY_KEYS_V1, 'lockPasswordOnLaunch'];

export const getSessionIntegrityKeys = (version: number): IntegrityKey[] => {
    switch (version) {
        case 1:
            return SESSION_INTEGRITY_KEYS_V1;
        case 2:
            return SESSION_INTEGRITY_KEYS_V2;
        default:
            return [];
    }
};

export const getSessionDigestVersion = (digest: string): number => {
    try {
        const [versionStr] = digest.split(VERSION_SEPARATOR);

        if (versionStr.length === digest.length) return SESSION_DIGEST_VERSION;
        const version = parseInt(versionStr, 10);
        return Number.isFinite(version) ? version : SESSION_DIGEST_VERSION;
    } catch {
        return SESSION_DIGEST_VERSION;
    }
};

/** Generates a unique digest based on specific session properties to ensure
 * the integrity of the session when resuming from a persisted state. This
 * digest can later be used to verify if the session has been tampered with. */
export const digestSession = async (
    session: Omit<AuthSession, EncryptedSessionKeys>,
    version: number
): Promise<string> => {
    const integrityKeys = getSessionIntegrityKeys(version);
    const serialize = (value: unknown) => (version === 1 ? value || '-' : (value ?? '-'));
    const sessionDigest = integrityKeys.reduce<string>((digest, key) => `${digest}::${serialize(session[key])}`, '');
    const sessionBuffer = stringToUint8Array(sessionDigest);
    const digest = await computeSHA256(sessionBuffer);

    return `${version}${VERSION_SEPARATOR}${digest.toBase64()}`;
};
