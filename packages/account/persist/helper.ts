import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { ProtonConfig, User } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { getDecryptedCache, getEncryptedCache } from './crypto';
import { deleteStore, readStore, writeStore } from './db';

export const getDecryptedPersistedState = async <T>({
    authentication,
    user,
}: {
    authentication: AuthenticationStore;
    user: User | undefined;
}) => {
    const localID = authentication.localID;
    const persistedSession = getPersistedSession(localID);
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
        return await getDecryptedCache<T>(encryptedCache, { clientKey });
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
