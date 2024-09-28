/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { type OfflineConfig, getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import type { Api, Maybe, MaybeNull } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { prop } from '@proton/pass/utils/fp/lens';
import { getLocalKey, getLocalSessions, setCookies } from '@proton/shared/lib/api/auth';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { getUser } from '@proton/shared/lib/api/user';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { LocalKeyResponse, LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { User as UserType } from '@proton/shared/lib/interfaces';
import getRandomString from '@proton/utils/getRandomString';

import { SESSION_DIGEST_VERSION, digestSession, getSessionDigestVersion } from './integrity';
import type { LockMode } from './lock/types';
import type { AuthOptions, AuthServiceConfig } from './service';
import type { AuthStore } from './store';

export type AuthSessionVersion = 1 | 2;
export const SESSION_VERSION: AuthSessionVersion = 1;

export type AuthSession = {
    AccessToken: string;
    cookies?: boolean;
    encryptedOfflineKD?: string;
    extraPassword?: boolean;
    keyPassword: string;
    lastUsedAt?: number;
    LocalID?: number;
    lockMode: LockMode;
    lockTTL?: number;
    offlineConfig?: OfflineConfig;
    offlineKD?: string;
    offlineVerifier?: string;
    payloadVersion?: AuthSessionVersion;
    persistent?: boolean;
    RefreshTime?: number;
    RefreshToken: string;
    sessionLockToken?: string;
    UID: string;
    unlockRetryCount?: number;
    userData?: string;
    UserID: string;
};

/** The following values of the `AuthSession` are locally stored in
 * an encrypted blob using the BE local key for the user's session */
export type EncryptedSessionKeys = 'keyPassword' | 'offlineKD' | 'sessionLockToken';
export type EncryptedAuthSession = Omit<AuthSession, EncryptedSessionKeys> & { blob: string };
export type DecryptedAuthSessionBlob = Pick<AuthSession, EncryptedSessionKeys> & { digest?: string };

export const SESSION_KEYS: (keyof AuthSession)[] = [
    'AccessToken',
    'cookies',
    'extraPassword',
    'keyPassword',
    'LocalID',
    'lockMode',
    'lockTTL',
    'offlineConfig',
    'offlineKD',
    'offlineVerifier',
    'payloadVersion',
    'persistent',
    'RefreshToken',
    'sessionLockToken',
    'UID',
    'UserID',
];

export const getSessionEncryptionTag = (version?: AuthSessionVersion): Maybe<Uint8Array> =>
    version === 2 ? stringToUtf8Array('session') : undefined;

/* Given a local session key, encrypts sensitive session components of
 * the `AuthSession` before persisting. Additionally stores a SHA-256
 * integrity digest of the session data to validate when resuming */
export const encryptPersistedSessionWithKey = async (session: AuthSession, clientKey: CryptoKey): Promise<string> => {
    const { keyPassword, offlineKD, payloadVersion = SESSION_VERSION, sessionLockToken, ...rest } = session;
    const digest = await digestSession(session, SESSION_DIGEST_VERSION);
    const blob: DecryptedAuthSessionBlob = { keyPassword, offlineKD, sessionLockToken, digest };

    const value: EncryptedAuthSession = {
        ...rest,
        blob: await getEncryptedBlob(clientKey, JSON.stringify(blob), getSessionEncryptionTag(payloadVersion)),
        payloadVersion,
    };

    return JSON.stringify(value);
};

/** Synchronizes an `AuthSession` with the latest auth data from the authentication store */
export const syncAuthSession = (session: AuthSession, authStore: AuthStore): AuthSession => ({
    ...session,
    AccessToken: authStore.getAccessToken() ?? session.AccessToken,
    RefreshTime: authStore.getRefreshTime() ?? session.RefreshTime,
    RefreshToken: authStore.getRefreshToken() ?? session.RefreshToken,
    UID: authStore.getUID() ?? session.UID,
    cookies: authStore.getCookieAuth() ?? session.cookies,
    persistent: authStore.getPersistent() ?? session.persistent,
});

/** Retrieves the current local key to decrypt the persisted session */
export const getPersistedSessionKey = async (api: Api, authStore: AuthStore): Promise<CryptoKey> => {
    const clientKey =
        authStore.getClientKey() ??
        (
            await api<LocalKeyResponse>({
                ...getLocalKey(),
                silence: true,
            })
        ).ClientKey;

    authStore.setClientKey(clientKey);
    return getClientKey(clientKey);
};

export const decryptSessionBlob = async (
    clientKey: CryptoKey,
    blob: string,
    payloadVersion: AuthSessionVersion
): Promise<DecryptedAuthSessionBlob> => {
    try {
        const decryptedBlob = await getDecryptedBlob(clientKey, blob, getSessionEncryptionTag(payloadVersion));
        const parsedValue = JSON.parse(decryptedBlob);

        if (!parsedValue.keyPassword) throw new Error('Missing `keyPassword`');

        return {
            keyPassword: parsedValue.keyPassword,
            offlineKD: parsedValue.offlineKD,
            sessionLockToken: parsedValue.sessionLockToken,
            digest: parsedValue.digest,
        };
    } catch (err) {
        throw new InvalidPersistentSessionError(getErrorMessage(err));
    }
};

export type ResumeSessionResult = {
    clientKey: CryptoKey;
    repersist: boolean;
    session: AuthSession;
};

/** Resumes an encrypted session by decrypting the session blob.
 * - Ensure the authentication store has been hydrated.
 * - Session tokens may be refreshed during this sequence.
 * - If applicable, upgrades the session to cookie-based auth. */
export const resumeSession = async (
    persistedSession: EncryptedAuthSession,
    localID: Maybe<number>,
    config: AuthServiceConfig,
    options: AuthOptions
): Promise<ResumeSessionResult> => {
    const { api, authStore, onSessionInvalid } = config;
    const { blob, ...session } = persistedSession;
    const { UID } = session;

    const cookieUpgrade = authStore.shouldCookieUpgrade(persistedSession);

    try {
        const [clientKey, { User }] = await Promise.all([
            getPersistedSessionKey(api, authStore),
            api<{ User: UserType }>(getUser()),
        ]);

        if (!persistedSession || persistedSession.UserID !== User.ID) throw InactiveSessionError();

        const payloadVersion = session.payloadVersion ?? SESSION_VERSION;
        const decryptedBlob = await decryptSessionBlob(clientKey, blob, payloadVersion);

        if (decryptedBlob.digest) {
            const version = getSessionDigestVersion(decryptedBlob.digest);
            const digest = await digestSession(persistedSession, version);
            if (digest !== decryptedBlob.digest) throw new InvalidPersistentSessionError();
        }

        if (cookieUpgrade) {
            /** Upgrade the session to cookie-based authentication.
             * This occurs after a successful token-based API call to ensure
             * tokens are refreshed before setting the refresh cookies.
             * We assume the session was persistent for this upgrade.*/
            const RefreshToken = authStore.getRefreshToken()!;
            await api(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: true }));
            authStore.setAccessToken('');
            authStore.setCookieAuth(true);
            authStore.setPersistent(true);
            authStore.setRefreshToken('');
        }

        /** Synchronize the session with the auth store to capture any mutations
         * that may have occurred during the resumption process (e.g., token refresh
         * or cookie upgrade). This ensures the returned session contains the most
         * up-to-date authentication data. */
        const syncedSession = syncAuthSession({ ...session, ...decryptedBlob }, authStore);

        return {
            clientKey,
            repersist: cookieUpgrade || !decryptedBlob.digest,
            session: syncedSession,
        };
    } catch (error: unknown) {
        if (onSessionInvalid) {
            return onSessionInvalid(error, {
                localID,
                invalidSession: persistedSession,
                retry: (session) => resumeSession(session, localID, config, options),
            });
        }

        throw error;
    }
};

export const getActiveSessions = (api: Api): Promise<MaybeNull<LocalSessionResponse[]>> =>
    api<{ Sessions: LocalSessionResponse[] }>(getLocalSessions())
        .then(prop('Sessions'))
        .catch(() => null);

export const migrateSession = async (authStore: AuthStore): Promise<boolean> => {
    let migrated = false;

    const offlineKD = authStore.getOfflineKD();
    const offlineConfig = authStore.getOfflineConfig();
    const offlineVerifier = authStore.getOfflineVerifier();

    /** Create the `offlineVerifier` if it hasn't been generated (<1.18.0) */
    if (offlineKD && offlineConfig && !offlineVerifier) {
        authStore.setOfflineVerifier(await getOfflineVerifier(stringToUint8Array(offlineKD)));
        migrated = true;
    }

    return migrated;
};
