/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import type { Api } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';
import { getLocalKey, setLocalKey } from '@proton/shared/lib/api/auth';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { getUser } from '@proton/shared/lib/api/user';
import { generateClientKey, getClientKey } from '@proton/shared/lib/authentication/clientKey';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import type { User as UserType } from '@proton/shared/lib/interfaces';

import type { AuthStore } from './store';

export type AuthSession = {
    AccessToken: string;
    keyPassword: string;
    LocalID?: number;
    RefreshTime?: number;
    RefreshToken: string;
    sessionLockToken?: string;
    UID: string;
    UserID: string;
};

export type PersistedAuthSession = Omit<AuthSession, 'keyPassword' | 'sessionLockToken'> & {
    blob: string;
    payloadVersion: 2 | 1;
};
export type PersistedAuthSessionBlob = Pick<AuthSession, 'keyPassword' | 'sessionLockToken'>;

export const SESSION_KEYS: (keyof AuthSession)[] = [
    'AccessToken',
    'keyPassword',
    'LocalID',
    'RefreshToken',
    'sessionLockToken',
    'UID',
    'UserID',
];

export const isValidSession = (data: Partial<AuthSession>): data is AuthSession =>
    Boolean(data.AccessToken && data.keyPassword && data.RefreshToken && data.UID && data.UserID);

export const isValidPersistedSession = (data: any): data is PersistedAuthSession =>
    isObject(data) &&
    Boolean('AccessToken' in data && data.AccessToken) &&
    Boolean('RefreshToken' in data && data.RefreshToken) &&
    Boolean('UID' in data && data.UID) &&
    Boolean('UserID' in data && data.UserID) &&
    Boolean('blob' in data && data.blob);

/** Given a local session key, encrypts the `AuthSession` before persisting.
 * Only the `keyPassword` & `sessionLockToken` will be encrypted. If you need
 * to re-create a random encryption key, use `encryptPersistedSession` directly. */
export const encryptPersistedSessionWithKey = async (
    { keyPassword, sessionLockToken, ...session }: AuthSession,
    sessionKey: CryptoKey
): Promise<string> => {
    let payloadVersion = 1 as PersistedAuthSession['payloadVersion'];
    const value: PersistedAuthSession = {
        ...session,
        payloadVersion,
        blob: await getEncryptedBlob(
            sessionKey,
            JSON.stringify({
                keyPassword,
                sessionLockToken,
            }),
            payloadVersion === 2 ? stringToUtf8Array('session') : undefined
        ),
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

/** Encrypts the `AuthSession` with a new encryption key. Will throw if local
 * key cannot be registered back-end side. Merge session tokens if the call to
 * `setLocalKey` triggered a refresh sequence. */
type EncryptSessionOptions = { api: Api; authStore: AuthStore };
export const encryptPersistedSession = async ({ api, authStore }: EncryptSessionOptions): Promise<string> => {
    const session = authStore.getSession();
    if (!isValidSession(session)) throw new Error('Trying to persist invalid session');

    const { serializedData, key } = await generateClientKey();

    await api<LocalKeyResponse>(withAuthHeaders(session.UID, session.AccessToken, setLocalKey(serializedData)));
    return encryptPersistedSessionWithKey(mergeSessionTokens(session, authStore), key);
};

/** Retrieves the current local key to decrypt the persisted session */
export const getPersistedSessionKey = async (api: Api): Promise<CryptoKey> => {
    const { ClientKey } = await api<LocalKeyResponse>(getLocalKey());
    return getClientKey(ClientKey);
};

const decryptPersistedSessionBlob = async (key: CryptoKey, blob: string, payloadVersion: number): Promise<string> => {
    try {
        return await getDecryptedBlob(key, blob, payloadVersion === 2 ? stringToUtf8Array('session') : undefined);
    } catch (_) {
        throw new InvalidPersistentSessionError('Failed to decrypt persisted session blob');
    }
};

const parsePersistedSessionBlob = (blob: string): PersistedAuthSessionBlob => {
    try {
        const parsedValue = JSON.parse(blob);
        return {
            keyPassword: parsedValue?.keyPassword ?? '',
            sessionLockToken: parsedValue?.sessionLockToken,
        };
    } catch (_) {
        throw new InvalidPersistentSessionError('Failed to parse persisted session blob');
    }
};

export const decryptPersistedSession = async (
    key: CryptoKey,
    blob: string,
    payloadVersion: number
): Promise<PersistedAuthSessionBlob> => {
    const decryptedBlob = await decryptPersistedSessionBlob(key, blob, payloadVersion);
    const persistedSessionBlob = parsePersistedSessionBlob(decryptedBlob);
    return persistedSessionBlob;
};

type ResumeSessionOptions = {
    api: Api;
    authStore: AuthStore;
    persistedSession: PersistedAuthSession;
    onSessionInvalid?: () => void;
};

/** Session resuming sequence responsible for decrypting the encrypted session
 * blob. ⚠️ Ensure the authentication store has been configured with authentication
 * options in order for requests to succeed. Session tokens may be refreshed during
 * this sequence. Returns the plain-text session alongside its encryption key. */
export const resumeSession = async ({
    api,
    authStore,
    persistedSession,
    onSessionInvalid,
}: ResumeSessionOptions): Promise<{
    session: AuthSession;
    sessionKey: CryptoKey;
}> => {
    try {
        const [sessionKey, { User }] = await Promise.all([
            getPersistedSessionKey(api),
            api<{ User: UserType }>(getUser()),
        ]);

        if (persistedSession.UserID !== User.ID) throw InactiveSessionError();
        const { blob, payloadVersion, ...session } = persistedSession;
        const { keyPassword, sessionLockToken } = await decryptPersistedSession(sessionKey, blob, payloadVersion);

        return {
            sessionKey,
            session: mergeSessionTokens({ ...session, keyPassword, sessionLockToken }, authStore),
        };
    } catch (error: any) {
        if (error instanceof InvalidPersistentSessionError) onSessionInvalid?.();
        throw error;
    }
};
