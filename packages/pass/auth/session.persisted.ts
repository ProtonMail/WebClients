import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';

import { removeLastRefreshDate } from '../api/refresh';
import { browserLocalStorage } from '../extension/storage';
import type { Maybe } from '../types';
import { partialMerge } from '../utils/object';
import { type ExtensionSession } from './session';

export const PERSISTED_SESSION_KEY = 'ps';

export type ExtensionPersistedSession = Omit<ExtensionSession, 'keyPassword' | 'sessionLockToken'> & { blob: string };
export type ExtensionPersistedSessionBlob = Pick<ExtensionSession, 'keyPassword'>;

export const setPersistedSession = async (
    key: CryptoKey,
    { keyPassword, sessionLockToken, ...session }: ExtensionSession
): Promise<void> =>
    browserLocalStorage.setItem(
        PERSISTED_SESSION_KEY,
        JSON.stringify({
            ...session,
            blob: await getEncryptedBlob(key, JSON.stringify({ keyPassword })),
        })
    );

export const getPersistedSessionBlob = (blob: string): Maybe<ExtensionPersistedSessionBlob> => {
    try {
        const parsedValue = JSON.parse(blob);
        return { keyPassword: parsedValue?.keyPassword ?? '' };
    } catch (_) {
        throw new InvalidPersistentSessionError('Failed to decrypt persisted session blob');
    }
};

export const getDecryptedPersistedSessionBlob = async (
    key: CryptoKey,
    blob: string
): Promise<ExtensionPersistedSessionBlob> => {
    const decryptedBlob = await getDecryptedBlob(key, blob);
    const persistedSessionBlob = getPersistedSessionBlob(decryptedBlob);

    if (!persistedSessionBlob) throw new InvalidPersistentSessionError('Failed to parse persisted blob');

    return persistedSessionBlob;
};

export const getPersistedSession = async (): Promise<Maybe<ExtensionPersistedSession>> => {
    const persistedSession = await browserLocalStorage.getItem(PERSISTED_SESSION_KEY);

    if (persistedSession) {
        try {
            const session = JSON.parse(persistedSession) as Partial<ExtensionPersistedSession>;
            return {
                UserID: session.UserID ?? '',
                UID: session.UID ?? '',
                AccessToken: session.AccessToken ?? '',
                RefreshToken: session.RefreshToken ?? '',
                blob: session.blob ?? '',
            };
        } catch {}
    }
};

export const updatePersistedSession = async (update: Partial<ExtensionPersistedSession>): Promise<void> => {
    const session = await getPersistedSession();

    if (session) {
        const updatedSession = partialMerge(session, update);
        return browserLocalStorage.setItem(PERSISTED_SESSION_KEY, JSON.stringify(updatedSession));
    }
};

export const removePersistedSession = async (): Promise<void> => {
    const session = await getPersistedSession();
    await browserLocalStorage.removeItem(PERSISTED_SESSION_KEY);

    if (session?.UID) await removeLastRefreshDate(session.UID);
};
