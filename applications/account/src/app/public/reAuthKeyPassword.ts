import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { BackupPasswordError, SecondPasswordError } from '@proton/shared/lib/authentication/error';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { handleUnlockKey } from '@proton/shared/lib/authentication/unlockKey';
import type { Api, KeySalt as tsKeySalt, User as tsUser } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../content/authSession';

/** Unlocks the keys of an existing session with its password and persists it again with the key password. */
export const handleReAuthKeyPassword = async ({
    authSession,
    User,
    clearKeyPassword,
    salts,
    api,
}: {
    authSession: AuthSession;
    User: tsUser;
    clearKeyPassword: string;
    salts: tsKeySalt[];
    api: Api;
}): Promise<AuthSession> => {
    const unlockResult = await handleUnlockKey(User, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        if (authSession.data.persistedSession.source === SessionSource.Saml) {
            throw new BackupPasswordError();
        }
        throw new SecondPasswordError();
    }
    const keyPassword = unlockResult.keyPassword;
    const sessionResult = await persistSession({
        User,
        LocalID: authSession.data.localID,
        UID: authSession.data.UID,
        persistent: authSession.data.persistedSession.persistent,
        trusted: authSession.data.persistedSession.trusted,
        source: authSession.data.persistedSession.source,
        keyPassword,
        clearKeyPassword,
        api,
    });
    return {
        // Carried over so that interruptions already cleared before this one are not asked for again
        interruptions: authSession.interruptions,
        data: sessionResult,
    };
};
