/* Inspired from packages/shared/lib/authentication/persistedSessionHelper.ts */
import { getLocalKey, revoke, setLocalKey } from '@proton/shared/lib/api/auth';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { getUser } from '@proton/shared/lib/api/user';
import { getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { User as UserType } from '@proton/shared/lib/interfaces';

import type { Api, Maybe } from '../types';
import { setInMemorySession } from './session.memory';
import type { ExtensionPersistedSession } from './session.persisted';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    removePersistedSession,
    setPersistedSession,
} from './session.persisted';

export type ExtensionSession = {
    AccessToken: string;
    keyPassword: string;
    RefreshToken: string;
    sessionLockToken?: string;
    UID: string;
    UserID: string;
};

export const SESSION_KEYS: (keyof ExtensionSession)[] = [
    'AccessToken',
    'keyPassword',
    'RefreshToken',
    'sessionLockToken',
    'UID',
    'UserID',
];

export const persistSession = async (api: Api, session: ExtensionSession): Promise<void> => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await getKey(rawKey);
    const base64StringKey = uint8ArrayToBase64String(rawKey);

    await api<LocalKeyResponse>(withAuthHeaders(session.UID, session.AccessToken, setLocalKey(base64StringKey)));
    await Promise.all([setPersistedSession(key, session), setInMemorySession(session)]);
};

export const getPersistedSessionKey = async (api: Api): Promise<CryptoKey> => {
    const { ClientKey } = await api<LocalKeyResponse>(getLocalKey());
    const rawKey = base64StringToUint8Array(ClientKey);

    return getKey(rawKey);
};

/**
 * Resume session flow :
 * - options::api is an optional parameter because as may be triggering
 *   the resume flow from a client pop-up (see ResumeSession.tsx) on browser
 *   start-up in order to by-pass SSL Cert errors during development. In that
 *   case we cannot use the worker's api instance
 * - if called with an options::api parameter, configure it with the persisted
 *   session authentication options - This will allow the session resuming flow
 *   to handle refreshing tokens when necessary (ie: session resume on browser
 *   start-up before the API is configured)
 */
export const resumeSession = async ({
    session,
    api,
}: {
    session: ExtensionPersistedSession;
    api: Api;
}): Promise<Maybe<ExtensionSession>> => {
    if (session.blob) {
        try {
            const [sessionKey, { User }] = await Promise.all([
                getPersistedSessionKey(api),
                api<{ User: UserType }>(getUser()),
            ]);

            if (session.UserID !== User.ID) throw InactiveSessionError();
            const ps = await getDecryptedPersistedSessionBlob(sessionKey, session.blob);

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
                UID: session.UID,
                UserID: User.ID,
            };
        } catch (e: any) {
            if (getIs401Error(e) || e instanceof InvalidPersistentSessionError) await removePersistedSession();
            throw e;
        }
    }
};

export const removeSession = async (api: Api) => {
    try {
        const persistedSession = await getPersistedSession();
        if (persistedSession !== undefined) {
            await api({ ...revoke(), silent: true });
            await removePersistedSession();
        }
    } catch (_) {}
};
