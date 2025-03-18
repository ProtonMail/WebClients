import deepFreeze from 'deep-freeze';

import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { ProtonConfig, User } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { getDecryptedCache, getEncryptedCache } from './crypto';
import { deleteStore, readStore, writeStore } from './db';

export const getDecryptedPersistedState = async <T>({
    authentication,
    persistedSession: maybePersistedSession,
    user,
}: {
    authentication: AuthenticationStore;
    persistedSession?: PersistedSession;
    user: User | undefined;
}) => {
    const localID = authentication.localID;
    const persistedSession = maybePersistedSession ?? getPersistedSession(localID);
    const clientKey = authentication.getClientKey();

    if (!persistedSession?.UserID || !clientKey) {
        return;
    }
    if (user && persistedSession.UserID !== user.ID) {
        return;
    }

    try {
        const encryptedCache = await readStore(persistedSession.UserID);
        if (!encryptedCache) {
            return;
        }
        const result = await getDecryptedCache<T>(encryptedCache, { clientKey });
        if (result?.state) {
            // This is important to speed up the preloaded state initialization in redux toolkit, otherwise it'll end
            // up in a non-mutable clause which has performance implications (however only in dev-mode)
            deepFreeze(result.state);
        }
        return result;
    } catch (e) {
        await deleteStore(persistedSession.UserID).catch(noop);
        return;
    }
};

export const setEncryptedPersistedState = async ({
    userID,
    eventID,
    clientKey,
    state,
    config,
}: {
    userID: string;
    eventID: string;
    state: string;
    clientKey: string;
    config: ProtonConfig;
}) => {
    if (!eventID || !clientKey || !state || !userID) {
        return;
    }
    try {
        const encryptedCache = await getEncryptedCache({
            clientKey,
            state,
        });
        const persistedValue = {
            state: encryptedCache,
            eventID,
            appVersion: config.APP_VERSION,
        };
        await writeStore(userID, persistedValue);
    } catch (e) {
        return;
    }
};
