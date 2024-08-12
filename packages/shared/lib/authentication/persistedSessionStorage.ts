import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import createListeners from '../helpers/listeners';
import { getItem, removeItem, setItem } from '../helpers/storage';
import type {
    DefaultPersistedSession,
    OfflinePersistedSession,
    PersistedSession,
    PersistedSessionBlob,
    PersistedSessionWithLocalID,
} from './SessionInterface';
import { InvalidPersistentSessionError } from './error';
import { getValidatedLocalID } from './fork/validation';
import type { OfflineKey } from './offlineKey';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

// We have business logic relying on this constant, please change with caution!
export const STORAGE_PREFIX = 'ps-';
const getKey = (localID: number) => `${STORAGE_PREFIX}${localID}`;

const sessionRemovalListeners = createListeners<PersistedSession[], Promise<void>>();

export const registerSessionRemovalListener = (listener: (persistedSessions: PersistedSession) => Promise<void>) => {
    sessionRemovalListeners.subscribe(listener);
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
            isSubUser: parsedValue.isSubUser || false,
            persistent: typeof parsedValue.persistent === 'boolean' ? parsedValue.persistent : true, // Default to true (old behavior)
            trusted: parsedValue.trusted || false,
            payloadVersion: parsedValue.payloadVersion || 1,
            persistedAt: parsedValue.persistedAt || 0,
            ...(parsedValue.offlineKeySalt
                ? {
                      payloadType: 'offline',
                      offlineKeySalt: parsedValue.offlineKeySalt,
                  }
                : { payloadType: 'default' }),
        };
    } catch (e: any) {
        return undefined;
    }
};

export const removePersistedSession = async (localID: number, UID: string) => {
    const oldSession = getPersistedSession(localID);
    if (oldSession?.UID) {
        removeLastRefreshDate(oldSession.UID);
    }
    if (!oldSession || (oldSession.UID && UID !== oldSession.UID)) {
        return;
    }
    if (sessionRemovalListeners.length()) {
        await Promise.all(sessionRemovalListeners.notify(oldSession)).catch(noop);
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
        const keyPassword = parsedValue.keyPassword || '';
        const offlineKeyPassword = parsedValue.offlineKeyPassword || '';

        if (parsedValue.offlineKeyPassword) {
            return {
                type: 'offline',
                keyPassword,
                offlineKeyPassword,
            };
        }

        return {
            type: 'default',
            keyPassword,
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
        offlineKey: OfflineKey | undefined;
        isSubUser: boolean;
        persistent: boolean;
        trusted: boolean;
    }
) => {
    const payloadVersion =
        1 as PersistedSession['payloadVersion']; /* Update to 2 when all clients understand it (safe for rollback) */

    const { clearTextPayloadData, encryptedPayloadData } = ((): {
        clearTextPayloadData:
            | Pick<OfflinePersistedSession, 'payloadType' | 'offlineKeySalt'>
            | Pick<DefaultPersistedSession, 'payloadType'>;
        encryptedPayloadData: PersistedSessionBlob;
    } => {
        if (data.offlineKey) {
            return {
                clearTextPayloadData: {
                    payloadType: 'offline',
                    offlineKeySalt: data.offlineKey.salt,
                },
                encryptedPayloadData: {
                    keyPassword: data.keyPassword,
                    offlineKeyPassword: data.offlineKey.password,
                },
            } as const;
        }

        return {
            clearTextPayloadData: {
                payloadType: 'default',
            },
            encryptedPayloadData: {
                keyPassword: data.keyPassword,
            },
        } as const;
    })();

    const persistedSession: PersistedSession = {
        UserID: data.UserID,
        UID: data.UID,
        isSubUser: data.isSubUser,
        persistent: data.persistent,
        trusted: data.trusted,
        payloadVersion,
        ...clearTextPayloadData,
        blob: await getEncryptedBlob(
            key,
            JSON.stringify(encryptedPayloadData),
            payloadVersion === 2 ? stringToUtf8Array('session') : undefined
        ),
        persistedAt: Date.now(),
    };
    setItem(getKey(localID), JSON.stringify(persistedSession));
};
