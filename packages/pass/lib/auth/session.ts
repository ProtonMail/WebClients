/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { type OfflineConfig, getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import type { Api, Maybe } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { isObject } from '@proton/pass/utils/object/is-object';
import { getLocalKey } from '@proton/shared/lib/api/auth';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { getUser } from '@proton/shared/lib/api/user';
import { getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { User as UserType } from '@proton/shared/lib/interfaces';

import type { LockMode } from './lock/types';
import type { AuthServiceConfig } from './service';
import type { AuthStore } from './store';

export type AuthSessionVersion = 1 | 2;
export const SESSION_VERSION: AuthSessionVersion = 1;

export type AuthSession = {
    AccessToken: string;
    keyPassword: string;
    LocalID?: number;
    lockMode: LockMode;
    lockTTL?: number;
    offlineConfig?: OfflineConfig;
    offlineKD?: string;
    offlineVerifier?: string;
    payloadVersion?: AuthSessionVersion;
    RefreshTime?: number;
    RefreshToken: string;
    sessionLockToken?: string;
    UID: string;
    unlockRetryCount?: number;
    UserID: string;
};

/** The following values of the `AuthSession` are locally stored in
 * an encrypted blob using the BE local key for the user's session */
export type EncryptedSessionKeys = 'keyPassword' | 'offlineKD' | 'sessionLockToken';
export type EncryptedAuthSession = Omit<AuthSession, EncryptedSessionKeys> & { blob: string };
export type DecryptedAuthSessionBlob = Pick<AuthSession, EncryptedSessionKeys>;

export const SESSION_KEYS: (keyof AuthSession)[] = [
    'AccessToken',
    'keyPassword',
    'LocalID',
    'lockMode',
    'lockTTL',
    'offlineConfig',
    'offlineKD',
    'offlineVerifier',
    'payloadVersion',
    'RefreshToken',
    'sessionLockToken',
    'UID',
    'UserID',
];

export const isValidSession = (data: Partial<AuthSession>): data is AuthSession =>
    Boolean(
        data.AccessToken &&
            data.RefreshToken &&
            data.UID &&
            data.UserID &&
            data.keyPassword &&
            (!data.offlineConfig || data.offlineKD)
    );

export const isValidPersistedSession = (data: any): data is EncryptedAuthSession =>
    isObject(data) &&
    Boolean('AccessToken' in data && data.AccessToken) &&
    Boolean('RefreshToken' in data && data.RefreshToken) &&
    Boolean('UID' in data && data.UID) &&
    Boolean('UserID' in data && data.UserID) &&
    Boolean('blob' in data && data.blob);

export const getSessionEncryptionTag = (version?: AuthSessionVersion): Maybe<Uint8Array> =>
    version === 2 ? stringToUtf8Array('session') : undefined;

/** Given a local session key, encrypts the `AuthSession` before persisting.
 * Only the `keyPassword` & `sessionLockToken` will be encrypted. If you need
 * to re-create a random encryption key, use `encryptPersistedSession` directly. */
export const encryptPersistedSessionWithKey = async (
    { keyPassword, offlineKD, payloadVersion = SESSION_VERSION, sessionLockToken, ...session }: AuthSession,
    clientKey: CryptoKey
): Promise<string> => {
    const blob: DecryptedAuthSessionBlob = { keyPassword, offlineKD, sessionLockToken };

    const value: EncryptedAuthSession = {
        ...session,
        blob: await getEncryptedBlob(clientKey, JSON.stringify(blob), getSessionEncryptionTag(payloadVersion)),
        payloadVersion,
    };

    return JSON.stringify(value);
};

/** Ensures that an AuthSession contains the latest tokens in
 * case they were refreshed during the sequence preceding this call */
export const mergeSessionTokens = (session: AuthSession, authStore: AuthStore): AuthSession => ({
    ...session,
    AccessToken: authStore.getAccessToken() ?? session.AccessToken,
    RefreshTime: authStore.getRefreshTime() ?? session.RefreshTime,
    RefreshToken: authStore.getRefreshToken() ?? session.RefreshToken,
    UID: authStore.getUID() ?? session.UID,
});

/** Retrieves the current local key to decrypt the persisted session */
export const getPersistedSessionKey = async (api: Api): Promise<CryptoKey> => {
    const { ClientKey } = await api<LocalKeyResponse>(getLocalKey());
    return getClientKey(ClientKey);
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
        };
    } catch (err) {
        throw new InvalidPersistentSessionError(getErrorMessage(err));
    }
};

export type ResumeSessionResult = { session: AuthSession; clientKey: CryptoKey };

/** Session resuming sequence responsible for decrypting the encrypted session
 * blob. ⚠️ Ensure the authentication store has been configured with authentication
 * options in order for requests to succeed. Session tokens may be refreshed during
 * this sequence. Returns the plain-text session alongside its encryption key. */
export const resumeSession = async (
    persistedSession: EncryptedAuthSession,
    localID: Maybe<number>,
    { api, authStore, onSessionInvalid }: AuthServiceConfig
): Promise<ResumeSessionResult> => {
    try {
        const [clientKey, { User }] = await Promise.all([
            getPersistedSessionKey(api),
            api<{ User: UserType }>(getUser()),
        ]);

        if (!persistedSession || persistedSession.UserID !== User.ID) throw InactiveSessionError();

        const { blob, ...session } = persistedSession;
        const payloadVersion = session.payloadVersion ?? SESSION_VERSION;
        const decryptedBlob = await decryptSessionBlob(clientKey, blob, payloadVersion);

        return {
            clientKey,
            session: mergeSessionTokens({ ...session, ...decryptedBlob }, authStore),
        };
    } catch (error: unknown) {
        if (onSessionInvalid) return await onSessionInvalid(error, { localID, invalidSession: persistedSession });
        else throw error;
    }
};

export const migrateSession = async (authStore: AuthStore): Promise<boolean> => {
    const offlineKD = authStore.getOfflineKD();
    const offlineConfig = authStore.getOfflineConfig();
    const offlineVerifier = authStore.getOfflineVerifier();

    if (offlineKD && offlineConfig && !offlineVerifier) {
        authStore.setOfflineVerifier(await getOfflineVerifier(stringToUint8Array(offlineKD)));
        return true;
    }

    return false;
};
