import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import isTruthy from '@proton/utils/isTruthy';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import { getItem, removeItem, setItem } from '../helpers/storage';
import { PersistedSession, PersistedSessionBlob, PersistedSessionWithLocalID } from './SessionInterface';
import { InvalidPersistentSessionError } from './error';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';
import { getValidatedLocalID } from './sessionForkValidation';

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
            trusted: parsedValue.trusted || false,
            payloadVersion: parsedValue.payloadVersion || 1,
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

export const getPersistedSessions = (): PersistedSessionWithLocalID[] => {
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
    blob: string,
    payloadVersion: PersistedSession['payloadVersion']
): Promise<PersistedSessionBlob> => {
    const decryptedBlob = await getDecryptedBlob(
        key,
        blob,
        payloadVersion === 2 ? stringToUtf8Array('session') : undefined
    ).catch(() => {
        throw new InvalidPersistentSessionError('Failed to decrypt persisted blob');
    });
    const parsedBlob = getPersistedSessionBlob(decryptedBlob);
    if (!parsedBlob) {
        throw new InvalidPersistentSessionError('Failed to parse persisted blob');
    }
    return parsedBlob;
};

export const setPersistedSessionWithBlob = async (
    localID: number,
    key: CryptoKey,
    data: {
        UserID: string;
        UID: string;
        keyPassword: string;
        isSubUser: boolean;
        persistent: boolean;
        trusted: boolean;
    }
) => {
    const payloadVersion =
        1 as PersistedSession['payloadVersion']; /* Update to 2 when all clients understand it (safe for rollback) */
    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
        isSubUser: data.isSubUser,
        persistent: data.persistent,
        trusted: data.trusted,
        payloadVersion,
        blob: await getEncryptedBlob(
            key,
            JSON.stringify({ keyPassword: data.keyPassword }),
            payloadVersion === 2 ? stringToUtf8Array('session') : undefined
        ),
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};
