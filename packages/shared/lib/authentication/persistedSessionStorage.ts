import { SessionKey } from 'pmcrypto';
import { setItem, getItem, removeItem } from '../helpers/storage';
import isTruthy from '../helpers/isTruthy';
import { PersistedSession, PersistedSessionBlob } from './SessionInterface';
import { getValidatedLocalID } from './sessionForkValidation';
import { InvalidPersistentSessionError } from './error';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

const STORAGE_PREFIX = 'ps-';
const getKey = (localID: number) => `${STORAGE_PREFIX}${localID}`;

export const removePersistedSession = (localID: number) => {
    removeItem(getKey(localID));
};

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
        };
    } catch (e) {
        return undefined;
    }
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
    } catch (e) {
        return undefined;
    }
};

export const getDecryptedPersistedSessionBlob = async (
    sessionKey: SessionKey,
    persistedSessionBlobString: string
): Promise<PersistedSessionBlob> => {
    const blob = await getDecryptedBlob(sessionKey, persistedSessionBlobString).catch(() => {
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
    sessionKey: SessionKey,
    data: { UserID: string; UID: string; keyPassword: string; isMember?: boolean }
) => {
    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
        isMember: data.isMember,
        blob: await getEncryptedBlob(sessionKey, JSON.stringify({ keyPassword: data.keyPassword })),
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};

export const setPersistedSession = (localID: number, data: { UID: string; UserID: string }) => {
    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};
