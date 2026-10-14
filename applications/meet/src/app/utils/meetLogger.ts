import { generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { LOGGER_DB_PREFIX } from '@proton/logger/constants';
import type { GeneratedLoggerKey } from '@proton/shared/lib/authentication/loggerKey';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import noop from '@proton/utils/noop';

export const MEET_LOGGER_NAME = 'meet';

const GUEST_LOGGER_KEY_STORAGE_KEY = 'meet.logger.guestKey';
const GUEST_LOGGER_ID_PREFIX = 'guest-';

interface StoredGuestLoggerKey {
    key: string;
    ID: string;
}

const getLoggerDatabaseName = (ID: string) => `${LOGGER_DB_PREFIX}${MEET_LOGGER_NAME}-${ID}`;

const isWebLocksSupported = () => 'locks' in navigator;

const getOrCreateStoredGuestLoggerKey = (): StoredGuestLoggerKey => {
    const stored = getItem(GUEST_LOGGER_KEY_STORAGE_KEY);

    if (stored) {
        return JSON.parse(stored);
    }

    const created = { key: generateKey().toBase64(), ID: `${GUEST_LOGGER_ID_PREFIX}${crypto.randomUUID()}` };
    setItem(GUEST_LOGGER_KEY_STORAGE_KEY, JSON.stringify(created));

    return created;
};

export const getGuestLoggerKey = async (): Promise<GeneratedLoggerKey> => {
    const { key, ID } = getOrCreateStoredGuestLoggerKey();

    return { key: await importKey(Uint8Array.fromBase64(key)), ID };
};

export const holdGuestLoggerLock = async (ID: string) => {
    if (!isWebLocksSupported()) {
        return;
    }

    await new Promise<void>((acquired, rejected) => {
        navigator.locks
            .request(getLoggerDatabaseName(ID), { mode: 'shared' }, () => {
                acquired();
                return new Promise(noop);
            })
            .catch(rejected);
    });
};

export const deleteUnusedGuestLoggerDatabases = async () => {
    if (!isWebLocksSupported()) {
        return;
    }

    const guestDatabasePrefix = getLoggerDatabaseName(GUEST_LOGGER_ID_PREFIX);
    const [databases, { held = [] }] = await Promise.all([indexedDB.databases(), navigator.locks.query()]);
    const databasesInUse = new Set(held.map(({ name }) => name));

    databases
        .map(({ name }) => name)
        .filter((name): name is string => !!name?.startsWith(guestDatabasePrefix) && !databasesInUse.has(name))
        .forEach((name) => indexedDB.deleteDatabase(name));
};
