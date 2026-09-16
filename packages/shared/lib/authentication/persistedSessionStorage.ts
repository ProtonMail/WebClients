import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import isEnumValue from '@proton/utils/isEnumValue';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import createListeners from '../helpers/listeners';
import { omit } from '../helpers/object';
import { getItem, getKeys, removeItem, setItem } from '../helpers/storage';
import {
    type DefaultPersistedSession,
    type OfflinePersistedSession,
    type PersistedSession,
    type PersistedSessionBlob,
    type PersistedSessionCookieData,
    SessionSource,
} from './SessionInterface';
import { AccessType } from './accessType';
import { InvalidPersistentSessionError } from './error';
import { getValidatedLocalID } from './fork/validation';
import type { OfflineKey } from './offlineKey';
import {
    SessionAccessTypeFlag,
    type SessionAccessTypeMask,
    getAccessTypeFromMask,
    getMaskFromAccessType,
    selfAccessTypeMask,
} from './sessionAccessType';
import { getDecryptedBlob, getDecryptedBlobV3, getEncryptedBlob, getEncryptedBlobV3 } from './sessionBlobCryptoHelper';

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
        const accessTypeMask = ((): SessionAccessTypeMask => {
            if (typeof parsedValue.accessTypeMask === 'number') {
                return parsedValue.accessTypeMask;
            }
            /* Legacy persisted value. The meaning has been inverted into `self`, so it compares to false. */
            if (parsedValue.isSubUser !== undefined) {
                return parsedValue.isSubUser === false ? selfAccessTypeMask : SessionAccessTypeFlag.AdminAccess;
            }
            if (parsedValue.isSelf !== undefined) {
                return parsedValue.isSelf === true ? selfAccessTypeMask : SessionAccessTypeFlag.AdminAccess;
            }
            /* Widened rather than read as a mask, since `AccessType.Msp` and `OrgAccess` differ */
            if (parsedValue.accessType !== undefined && isEnumValue(parsedValue.accessType, AccessType)) {
                return getMaskFromAccessType(parsedValue.accessType);
            }
            return selfAccessTypeMask;
        })();
        return {
            localID,
            UserID: parsedValue.UserID || '',
            UID: parsedValue.UID || '',
            blob: parsedValue.blob || '',
            source: parsedValue.source ?? SessionSource.Proton, // Default to Proton since we can't determine it properly
            accessTypeMask,
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

export const getMinimalPersistedSession = ({
    localID,
    accessTypeMask,
}: PersistedSession): PersistedSessionCookieData => {
    return {
        localID,
        accessTypeMask,
    };
};

const getPersistedSessionBlob = (blob: string): PersistedSessionBlob | undefined => {
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

const getEncryptedPersistedSessionBlobData = (
    key: CryptoKey,
    data: string,
    payloadVersion: PersistedSession['payloadVersion']
) => {
    if (payloadVersion === 3) {
        return getEncryptedBlobV3(key, data, utf8StringToUint8Array('session'));
    }
    return getEncryptedBlob(key, data, payloadVersion === 2 ? utf8StringToUint8Array('session') : undefined);
};

const getDecryptedPersistedSessionBlobData = (
    key: CryptoKey,
    blob: string,
    payloadVersion: PersistedSession['payloadVersion']
) => {
    if (payloadVersion === 3) {
        return getDecryptedBlobV3(key, blob, utf8StringToUint8Array('session'));
    }
    return getDecryptedBlob(key, blob, payloadVersion === 2 ? utf8StringToUint8Array('session') : undefined);
};

export const getDecryptedPersistedSessionBlob = async (
    key: CryptoKey,
    blob: string,
    payloadVersion: PersistedSession['payloadVersion']
): Promise<PersistedSessionBlob> => {
    const decryptedBlob = await getDecryptedPersistedSessionBlobData(key, blob, payloadVersion).catch(() => {
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
        accessTypeMask: SessionAccessTypeMask;
        persistent: boolean;
        trusted: boolean;
        persistedAt: number;
        source: PersistedSession['source'];
    }
): Promise<PersistedSession> => {
    /* Versions 2 and 3 can be read, but only version 1 is written (safe for rollback). */
    /* TODO: Make this change after 2026-10-16. */
    const payloadVersion: PersistedSession['payloadVersion'] = 1;

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
        accessTypeMask: data.accessTypeMask,
        persistent: data.persistent,
        trusted: data.trusted,
        source: data.source,
        payloadVersion,
        ...clearTextPayloadData,
        blob: await getEncryptedPersistedSessionBlobData(key, JSON.stringify(encryptedPayloadData), payloadVersion),
        persistedAt: data.persistedAt,
    };
};

export const setPersistedSession = async (persistedSession: PersistedSession) => {
    setItem(
        getKey(persistedSession.localID),
        JSON.stringify({
            ...omit(persistedSession, ['localID']),
            // Only a rollback reads this. TODO: Drop once rolling back past 2026-09-16 is out of scope.
            accessType: getAccessTypeFromMask(persistedSession.accessTypeMask),
        })
    );

    if (sessionCreateListeners.length()) {
        await Promise.all(sessionCreateListeners.notify(persistedSession)).catch(noop);
    }
};
