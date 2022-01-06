import { setItem, getItem, removeItem } from '../helpers/storage';
import isTruthy from '../helpers/isTruthy';
import { PersistedSession, PersistedSessionBlob } from './SessionInterface';
import { getValidatedLocalID } from './sessionForkValidation';
import { InvalidPersistentSessionError } from './error';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';
import { removeLastRefreshDate } from '../api/helpers/refreshStorage';

const STORAGE_PREFIX = 'ps-';
const getKey = (localID: number) => `${STORAGE_PREFIX}${localID}`;

export const getPersistedSession = (localID: number): PersistedSession | undefined => {
    const itemValue = getItem(getKey(localID));
    if (!itemValue) {
        return;
    }
    try {
        const parsedValue = JSON.parse(itemValue);
        return {
            UserID: parsedValue.UserID || '',
            UID: parsedValue.UID || '',
            blob: parsedValue.blob || '',
            isSubUser: parsedValue.isSubUser || false,
            persistent: typeof parsedValue.persistent === 'boolean' ? parsedValue.persistent : true, // Default to true (old behavior)
        };
    } catch (e: any) {
        return undefined;
    }
};

export const removePersistedSession = (localID: number, UID: string) => {
    const oldSession = getPersistedSession(localID);
    if (oldSession?.UID) {
        removeLastRefreshDate(oldSession.UID);
    }
    if (oldSession?.UID && UID !== oldSession.UID) {
        return;
    }
    removeItem(getKey(localID));
};

export const getPersistedSessions = () => {
    const localStorageKeys = Object.keys(localStorage);
    return localStorageKeys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => {
            const localID = getValidatedLocalID(key.slice(STORAGE_PREFIX.length));
            if (localID === undefined) {
                return;
            }
            const result = getPersistedSession(localID);
            if (!result) {
                return;
            }
            return {
                ...result,
                localID,
            };
        })
        .filter(isTruthy);
};

export const getPersistedSessionBlob = (blob: string): PersistedSessionBlob | undefined => {
    try {
        const parsedValue = JSON.parse(blob);
        return {
            keyPassword: parsedValue.keyPassword || '',
        };
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

export const setPersistedSessionWithBlob = async (
    localID: number,
    key: CryptoKey,
    data: { UserID: string; UID: string; keyPassword: string; isSubUser: boolean; persistent: boolean }
) => {
    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
        isSubUser: data.isSubUser,
        blob: await getEncryptedBlob(key, JSON.stringify({ keyPassword: data.keyPassword })),
        persistent: data.persistent,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};

export const setPersistedSession = (localID: number, data: { UID: string; UserID: string; persistent: boolean }) => {
    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
        isSubUser: false,
        persistent: data.persistent,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};
