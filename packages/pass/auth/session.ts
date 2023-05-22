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

import type { Api } from '../types';
import type { ExtensionPersistedSession } from './persisted-session';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    removePersistedSession,
    setPersistedSessionWithBlob,
} from './persisted-session';

export type PersistSessionOptions = {
    keyPassword: string;
    AccessToken: string;
    RefreshToken: string;
    User: UserType;
    UID: string;
    LocalID: number;
    persistent: boolean;
    trusted: boolean;
};

export const persistSession = async (api: Api, options: PersistSessionOptions): Promise<void> => {
    const { UID, AccessToken } = options;
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await getKey(rawKey);
    const base64StringKey = uint8ArrayToBase64String(rawKey);

    await api<LocalKeyResponse>(withAuthHeaders(UID, AccessToken, setLocalKey(base64StringKey)));
    await setPersistedSessionWithBlob(key, options);
};

export type ResumedSessionResult = {
    User: UserType;
    UID: string;
    AccessToken: string;
    RefreshToken: string;
    keyPassword: string;
    persistent: boolean;
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
}): Promise<ResumedSessionResult | undefined> => {
    if (session.blob) {
        try {
            const [{ ClientKey }, { User }] = await Promise.all([
                api<LocalKeyResponse>(getLocalKey()),
                api<{ User: UserType }>(getUser()),
            ]);

            const rawKey = base64StringToUint8Array(ClientKey);
            const key = await getKey(rawKey);
            const { keyPassword } = await getDecryptedPersistedSessionBlob(key, session.blob);

            if (session.UserID !== User.ID) {
                throw InactiveSessionError();
            }

            /**
             * access|refresh token may have been internally
             * refreshed during the API requests required for
             * parsing the persisted session.
             */
            const AccessToken = api.getAuth()?.AccessToken ?? session.AccessToken;
            const RefreshToken = api.getAuth()?.RefreshToken ?? session.RefreshToken;

            return {
                UID: session.UID,
                AccessToken,
                RefreshToken,
                User,
                keyPassword,
                persistent: session.persistent,
            };
        } catch (e: any) {
            if (getIs401Error(e) || e instanceof InvalidPersistentSessionError) {
                await removePersistedSession();
            }

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
