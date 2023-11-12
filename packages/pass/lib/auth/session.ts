/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import type { Api } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';
import { getLocalKey, setLocalKey } from '@proton/shared/lib/api/auth';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { getUser } from '@proton/shared/lib/api/user';
import { getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
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

export type PersistedAuthSession = Omit<AuthSession, 'keyPassword' | 'sessionLockToken'> & { blob: string };
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

export const encryptPersistedSession = async (
    api: Api,
    { keyPassword, sessionLockToken, ...session }: AuthSession
): Promise<string> => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await getKey(rawKey);
    const base64StringKey = uint8ArrayToBase64String(rawKey);

    await api<LocalKeyResponse>(withAuthHeaders(session.UID, session.AccessToken, setLocalKey(base64StringKey)));

    return JSON.stringify({
        ...session,
        blob: await getEncryptedBlob(key, JSON.stringify({ keyPassword, sessionLockToken })),
    });
};

export const getPersistedSessionKey = async (api: Api): Promise<CryptoKey> => {
    const { ClientKey } = await api<LocalKeyResponse>(getLocalKey());
    const rawKey = base64StringToUint8Array(ClientKey);

    return getKey(rawKey);
};

const decryptPersistedSessionBlob = async (key: CryptoKey, blob: string): Promise<string> => {
    try {
        return await getDecryptedBlob(key, blob);
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

export const decryptPersistedSession = async (key: CryptoKey, blob: string): Promise<PersistedAuthSessionBlob> => {
    const decryptedBlob = await decryptPersistedSessionBlob(key, blob);
    const persistedSessionBlob = parsePersistedSessionBlob(decryptedBlob);
    return persistedSessionBlob;
};

type ResumeSessionOptions = {
    api: Api;
    authStore: AuthStore;
    persistedSession: PersistedAuthSession;
    onSessionInvalid?: () => void;
};

/* Session resuming flow responsible for decrypting the encrypted session
 * blob. Ensure the authentication store is configured with authentication
 * options in order for requests to succeed */
export const resumeSession = async ({
    api,
    authStore,
    persistedSession,
    onSessionInvalid,
}: ResumeSessionOptions): Promise<AuthSession> => {
    try {
        const [sessionKey, { User }] = await Promise.all([
            getPersistedSessionKey(api),
            api<{ User: UserType }>(getUser()),
        ]);

        if (persistedSession.UserID !== User.ID) throw InactiveSessionError();
        const ps = await decryptPersistedSession(sessionKey, persistedSession.blob);

        return {
            ...authStore.getSession(),
            keyPassword: ps.keyPassword,
            sessionLockToken: ps.sessionLockToken,
        };
    } catch (error: any) {
        if (getIs401Error(error) || error instanceof InvalidPersistentSessionError) onSessionInvalid?.();
        throw error;
    }
};
