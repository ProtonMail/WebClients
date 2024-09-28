import { deletePassDB, getPassDBUserID, getPassDBs } from 'proton-pass-web/lib/database';
import { getSessionKey } from 'proton-pass-web/lib/sessions';

import type { EncryptedAuthSession } from '@proton/pass/lib/auth/session';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export const B2B_STORAGE_KEY = 'b2bEvents';
export const SETTINGS_STORAGE_KEY = 'settings';
export const TELEMETRY_STORAGE_KEY = 'telemetry';

export const getStorageKey = (prefix: string) => (localID?: number) =>
    localID !== undefined ? `${prefix}::${localID}` : prefix;

export const getB2BEventsStorageKey = getStorageKey(B2B_STORAGE_KEY);
export const getSettingsStorageKey = getStorageKey(SETTINGS_STORAGE_KEY);
export const getTelemetryStorageKey = getStorageKey(TELEMETRY_STORAGE_KEY);

const LOCALID_STORAGE_KEYS = [SETTINGS_STORAGE_KEY, TELEMETRY_STORAGE_KEY, B2B_STORAGE_KEY];
const LOCALID_STORAGE_RE = new RegExp(`^(?:${LOCALID_STORAGE_KEYS.join('|')})::(\\d+)`);

export const clearUserLocalData = (localID: number) => {
    localStorage.removeItem(getSessionKey(localID));
    localStorage.removeItem(getSettingsStorageKey(localID));
    localStorage.removeItem(getTelemetryStorageKey(localID));
    localStorage.removeItem(getB2BEventsStorageKey(localID));
};

export const localGarbageCollect = async (encryptedSessions: EncryptedAuthSession[]) => {
    const dbs = await getPassDBs();
    const userIDs = new Set(encryptedSessions.map(prop('UserID')));
    const localIDs = new Set(encryptedSessions.map(prop('LocalID')));

    /** Remove legacy non-indexed storage keys */
    localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    localStorage.removeItem(B2B_STORAGE_KEY);

    /** Wipe any local database that cannot be resumed
     * due to a missing local session */
    for (const db of dbs) {
        const userID = getPassDBUserID(db);
        if (!userIDs.has(userID)) {
            logger.debug(`[GarbageCollect] Clearing stale database for ${userID}`);
            await deletePassDB(userID).catch(noop);
        }
    }

    /** Check for localID indexed storage keys : if we do not have a valid
     * session for this entry, remove it */
    Object.keys(localStorage).forEach((key) => {
        const match = key.match(LOCALID_STORAGE_RE);
        if (match) {
            const localID = parseInt(match[1], 10);
            if (Number.isFinite(localID) && !localIDs.has(localID)) {
                logger.debug(`[GarbageCollect] Clearing stale "${key}" storage`);
                localStorage.removeItem(key);
            }
        }
    });
};
