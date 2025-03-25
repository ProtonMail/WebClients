import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { omit } from '@proton/shared/lib/helpers/object';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import createListeners from '../helpers/listeners';
import { getItem, getKeys, removeItem, setItem } from '../helpers/storage';
import {
    type DefaultPersistedSession,
    type OfflinePersistedSession,
    type PersistedSession,
    type PersistedSessionBlob,
    type PersistedSessionLite,
    SessionSource,
} from './SessionInterface';
import { InvalidPersistentSessionError } from './error';
import { getValidatedLocalID } from './fork/validation';
import type { OfflineKey } from './offlineKey';
import { getDecryptedBlob, getEncryptedBlob } from './sessionBlobCryptoHelper';

// We have business logic relying on this constant, please change with caution!
export const STORAGE_PREFIX = 'ps-';
const getKey = (localID: number) => `${STORAGE_PREFIX}${localID}`;

const sessionCreateListeners = createListeners<[PersistedSession], Promise<void>>();
const sessionRemovalListeners = createListeners<[PersistedSession], Promise<void>>();

export const registerSessionCreateListener = (listener: (persistedSession: PersistedSession) => Promise<void>) => {
    sessionCreateListeners.subscribe(listener);
};

export const registerSessionRemovalListener = (listener: (persistedSession: PersistedSession) => Promise<void>) => {
    sessionRemovalListeners.subscribe(listener);
};

export const getPersistedSession = (localID: number): PersistedSession | undefined => {
    const itemValue = getItem(getKey(localID));
    if (!itemValue) {
        return;
    }
    try {
        const parsedValue = JSON.parse(itemValue);
        const isSelf = (() => {
            /* Legacy persisted value. The meaning has been inverted into `self`, so it compares to false. */
            if (parsedValue.isSubUser !== undefined) {
                return parsedValue.isSubUser === false;
            }
            if (parsedValue.isSelf !== undefined) {
                return parsedValue.isSelf === true;
            }
            return true;
        })();
        return {
            localID,
            UserID: parsedValue.UserID || '',
            UID: parsedValue.UID || '',
            blob: parsedValue.blob || '',
            source: parsedValue.source ?? SessionSource.Proton, // Default to Proton since we can't determine it properly
            isSelf,
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

export const removePersistedSession = async (session: PersistedSession) => {
    removeLastRefreshDate(session.UID);
    removeItem(getKey(session.localID));
    if (sessionRemovalListeners.length()) {
        await Promise.all(sessionRemovalListeners.notify(session)).catch(noop);
    }
};

// Retrieve a persisted session by LocalID and UserID combination, since they could potentially change in asynchronous scenarios
export const getPersistedSessionByLocalIDAndUserID = (localID: number, UserID: string) => {
    const persistedSession = getPersistedSession(localID);
    if (!persistedSession || persistedSession.UserID !== UserID) {
        return;
    }
    return persistedSession;
};

// Retrieve a persisted session by LocalID and UID combination, since they could potentially change in asynchronous scenarios
export const getPersistedSessionByLocalIDAndUID = (localID: number, UID: string) => {
    const persistedSession = getPersistedSession(localID);
    if (!persistedSession || persistedSession.UID !== UID) {
        return;
    }
    return persistedSession;
};

export const removePersistedSessionByLocalIDAndUID = async (localID: number, UID: string) => {
    const persistedSession = getPersistedSessionByLocalIDAndUID(localID, UID);
    if (!persistedSession) {
        return;
    }
    return removePersistedSession(persistedSession);
};

export const getPersistedSessions = (): PersistedSession[] => {
    const localStorageKeys = getKeys();
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

export const getPersistedSessionByUID = (UID: string) => {
    const persistedSessions = getPersistedSessions();
    return persistedSessions.find((session) => session.UID === UID);
};

export const getMinimalPersistedSession = ({ localID, isSelf }: PersistedSession): PersistedSessionLite => {
    return {
        localID,
        isSelf,
    };
};

export const getPersistedSessionBlob = (blob: string): PersistedSessionBlob | undefined => {
    try {
        const parsedValue = JSON.parse(blob);
        const keyPassword = parsedValue.keyPassword ?? '';
        const offlineKeyPassword = parsedValue.offlineKeyPassword ?? '';

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
export const getPersistedSessionData = async (
    localID: number,
    key: CryptoKey,
    data: {
        UserID: string;
        UID: string;
        keyPassword: string;
        offlineKey: OfflineKey | undefined;
        isSelf: boolean;
        persistent: boolean;
        trusted: boolean;
        persistedAt: number;
        source: PersistedSession['source'];
    }
): Promise<PersistedSession> => {
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

    return {
        localID,
        UserID: data.UserID,
        UID: data.UID,
        isSelf: data.isSelf,
        persistent: data.persistent,
        trusted: data.trusted,
        source: data.source,
        payloadVersion,
        ...clearTextPayloadData,
        blob: await getEncryptedBlob(
            key,
            JSON.stringify(encryptedPayloadData),
            payloadVersion === 2 ? stringToUtf8Array('session') : undefined
        ),
        persistedAt: data.persistedAt,
    };
};

export const setPersistedSession = async (persistedSession: PersistedSession) => {
    setItem(getKey(persistedSession.localID), JSON.stringify(omit(persistedSession, ['localID'])));

    if (sessionCreateListeners.length()) {
        await Promise.all(sessionCreateListeners.notify(persistedSession)).catch(noop);
    }
};
