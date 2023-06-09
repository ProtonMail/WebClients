import type { PersistedSession, PersistedSessionBlob } from '@proton/shared/lib/authentication/SessionInterface';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';

import { removeLastRefreshDate } from '../api/refresh';
import { browserLocalStorage } from '../extension/storage';
import type { PersistSessionOptions } from './session';

/**
 * Simplified version of packages/shared/lib/authentication/persistedSessionHelper.ts :
 * - no SSO as the extension does not handle account switching
 * - uses the chrome storage API for saving the encrypted persisted session
 *
 * We should try to make the persisted session helpers in @proton/shared
 * compatible with the service-worker environment to avoid code duplication
 */
export const LOCAL_SESSION_KEY = 'ps';

export type ExtensionPersistedSession = PersistedSession & {
    AccessToken: string;
    RefreshToken: string;
};

export const setPersistedSession = async (persistedSession: ExtensionPersistedSession) =>
    browserLocalStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(persistedSession));

export const setPersistedSessionWithBlob = async (
    key: CryptoKey,
    { User, UID, keyPassword, persistent, trusted, AccessToken, RefreshToken }: PersistSessionOptions
) => {
    const persistedSession: ExtensionPersistedSession = {
        UserID: User.ID,
        UID,
        AccessToken,
        RefreshToken,
        isSubUser: !!User.OrganizationPrivateKey,
        blob: await getEncryptedBlob(key, JSON.stringify({ keyPassword })),
        persistent,
        trusted,
    };

    await setPersistedSession(persistedSession);
};

export const getPersistedSessionBlob = (blob: string): PersistedSessionBlob | undefined => {
    try {
        const parsedValue = JSON.parse(blob);
        return { keyPassword: parsedValue.keyPassword || '' };
    } catch (e: any) {
        return undefined;
    }
};

export const getDecryptedPersistedSessionBlob = async (
    key: CryptoKey,
    persistedSessionBlobString: string
): Promise<PersistedSessionBlob> => {
    const blob = await getDecryptedBlob(key, persistedSessionBlobString).catch(() => {
        throw new InvalidPersistentSessionError('Failed to decrypt persisted blob');
    });

    const persistedSessionBlob = getPersistedSessionBlob(blob);

    if (!persistedSessionBlob) {
        throw new InvalidPersistentSessionError('Failed to parse persisted blob');
    }

    return persistedSessionBlob;
};

export const getPersistedSession = async (): Promise<ExtensionPersistedSession | undefined> => {
    const persistedSession = await browserLocalStorage.getItem(LOCAL_SESSION_KEY);

    if (persistedSession) {
        try {
            const session = JSON.parse(persistedSession);
            return {
                UserID: session.UserID || '',
                UID: session.UID || '',
                AccessToken: session.AccessToken ?? '',
                RefreshToken: session.RefreshToken ?? '',
                blob: session.blob || '',
                isSubUser: session.isSubUser || false,
                persistent: typeof session.persistent === 'boolean' ? session.persistent : true,
                trusted: typeof session.trusted === 'boolean' ? session.trusted : false,
            };
        } catch (e: any) {
            return undefined;
        }
    }
};

export const removePersistedSession = async () => {
    const session = await getPersistedSession();

    await browserLocalStorage.removeItem(LOCAL_SESSION_KEY);
    return session?.UID && (await removeLastRefreshDate(session.UID));
};
