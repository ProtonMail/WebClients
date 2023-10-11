/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import type { Api, Maybe } from '@proton/pass/types';
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

export type ExtensionSession = {
    AccessToken: string;
    keyPassword: string;
    RefreshToken: string;
    RefreshTime?: number;
    sessionLockToken?: string;
    UID: string;
    UserID: string;
};

export type ExtensionPersistedSession = Omit<ExtensionSession, 'keyPassword' | 'sessionLockToken'> & { blob: string };
export type ExtensionPersistedSessionBlob = Pick<ExtensionSession, 'keyPassword' | 'sessionLockToken'>;

export const SESSION_KEYS: (keyof ExtensionSession)[] = [
    'AccessToken',
    'keyPassword',
    'RefreshToken',
    'sessionLockToken',
    'UID',
    'UserID',
];

export const isValidSession = (maybeSession: Partial<ExtensionSession>): maybeSession is ExtensionSession =>
    Boolean(
        maybeSession.AccessToken &&
            maybeSession.keyPassword &&
            maybeSession.RefreshToken &&
            maybeSession.UID &&
            maybeSession.UserID
    );

export const encryptPersistedSession = async (
    api: Api,
    { keyPassword, sessionLockToken, ...session }: ExtensionSession
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

const parsePersistedSessionBlob = (blob: string): ExtensionPersistedSessionBlob => {
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

export const decryptPersistedSession = async (key: CryptoKey, blob: string): Promise<ExtensionPersistedSessionBlob> => {
    const decryptedBlob = await decryptPersistedSessionBlob(key, blob);
    const persistedSessionBlob = parsePersistedSessionBlob(decryptedBlob);
    return persistedSessionBlob;
};

/* Resume session flow :
 * - options::api is an optional parameter because as may be triggering
 *   the resume flow from a client pop-up (see ResumeSession.tsx) on browser
 *   start-up in order to by-pass SSL Cert errors during development. In that
 *   case we cannot use the worker's api instance
 * - if called with an options::api parameter, configure it with the persisted
 *   session authentication options - This will allow the session resuming flow
 *   to handle refreshing tokens when necessary (ie: session resume on browser
 *   start-up before the API is configured) */
export const resumeSession = async ({
    api,
    session,
    onInvalidSession,
}: {
    api: Api;
    session: ExtensionPersistedSession;
    onInvalidSession: () => void;
}): Promise<Maybe<ExtensionSession>> => {
    try {
        const [sessionKey, { User }] = await Promise.all([
            getPersistedSessionKey(api),
            api<{ User: UserType }>(getUser()),
        ]);

        if (session.UserID !== User.ID) throw InactiveSessionError();
        const ps = await decryptPersistedSession(sessionKey, session.blob);

        /* access|refresh token may have been internally refreshed
         * during the API requests required for parsing the persisted
         * session. In that case, the refresh handlers will take care
         * of updating the persisted session tokens */
        const AccessToken = api.getAuth()?.AccessToken ?? session.AccessToken;
        const RefreshToken = api.getAuth()?.RefreshToken ?? session.RefreshToken;

        return {
            AccessToken,
            keyPassword: ps.keyPassword,
            RefreshToken,
            sessionLockToken: ps.sessionLockToken,
            UID: session.UID,
            UserID: User.ID,
        };
    } catch (e: any) {
        if (getIs401Error(e) || e instanceof InvalidPersistentSessionError) onInvalidSession();
        throw e;
    }
};
