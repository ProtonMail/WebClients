import { homeDir, join, normalize, sep } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { create, readDir, remove } from '@tauri-apps/plugin-fs';
import { db } from 'proton-authenticator/lib/db/db';
import { toWasmEntry } from 'proton-authenticator/lib/entries/items';
import { service } from 'proton-authenticator/lib/wasm/service';
import type { AppThunkExtra } from 'proton-authenticator/store';
import { c } from 'ttag';

import { prop } from '@proton/pass/utils/fp/lens';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const BACKUP_MAX_AMOUNT = 5;

const createFilename = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${AUTHENTICATOR_APP_NAME}_export_${year}-${month}-${day}`;
};

const getBackupFilenameRegex = () => new RegExp(`^${AUTHENTICATOR_APP_NAME}_export_\\d{4}-\\d{2}-\\d{2}\\.json$`);

const parseDateFromFilename = (filename: string) => {
    const regex = new RegExp(`^${AUTHENTICATOR_APP_NAME}_export_(\\d{4})-(\\d{2})-(\\d{2})\\.json$`);
    const match = filename.match(new RegExp(regex));
    if (!match) return null;

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
};

const isPathInHome = async (path: string) => {
    const home = await normalize(await homeDir());
    const separator = sep();
    const homeWithSlash = home.endsWith(separator) ? home : `${home}${separator}`;
    const normalizedPath = await normalize(path);

    return normalizedPath.startsWith(homeWithSlash);
};

/** Sorts backup files by ASCENDING dates by parsing
 * the timestamp from the filename. */
export const sortBackupsByDate = (filenames: string[]): string[] => {
    const fileDates = filenames.map((filename) => {
        const date = parseDateFromFilename(filename);
        return { filename, date: date !== null ? +date : -1 };
    });

    return fileDates
        .filter(({ date }) => date > 0)
        .sort(sortOn('date', 'ASC'))
        .map(prop('filename'));
};

/** Reads the user's `backupDirectory` and filters out files
 * matching our automatic backup filename format. */
export const readCurrentBackups = async (backupDirectory: string): Promise<string[]> => {
    try {
        const backups = await readDir(backupDirectory);
        const backupFilenameRegex = getBackupFilenameRegex();

        return backups
            .filter((entry) => entry.isFile && !entry.isSymlink && backupFilenameRegex.test(entry.name))
            .map((entry) => entry.name);
    } catch (err) {
        logger.warn(`[backups::read] could not resolve current backups (${err})`);
        return [];
    }
};

export const createAutomaticBackupFilename = () => `${createFilename()}.json`;
/** Non-automatic backups have a different format to avoid
 * matching them in the user's backup directory. */
export const createBackupFilename = () => `${createAutomaticBackupFilename()}_${getEpoch()}.json`;

/** Deletes backup files older than the last `BACKUP_MAX_AMOUNT` (=5) files.
 * Reads all backup files from the directory, sorts them by date (oldest first),
 * and removes excess files to maintain the configured limit. Individual file
 * deletion errors are silently ignored to prevent one locked file from blocking
 * the entire cleanup process. */
export const pruneExcessBackups = async (backupDirectory: string, max: number = BACKUP_MAX_AMOUNT) => {
    try {
        const backups = await readCurrentBackups(backupDirectory);

        if (backups.length > max) {
            const sorted = sortBackupsByDate(backups);
            const toRemove = sorted.slice(0, backups.length - max);

            for (const filename of toRemove) {
                await join(backupDirectory, filename)
                    .then((path) => remove(path))
                    .catch(noop);
            }
        }
    } catch (err) {
        logger.error(`[Entries::automaticBackup] Failed to cleanup backup directory (${err})`);
    }
};

/** We only allow backup directory inside home directory for now.
 * (With "fs:allow-home-write-recursive" in applications/authenticator/src-tauri/capabilities/default.json) */
export const promptValidBackupDirectory = async (createNotification: AppThunkExtra['createNotification']) => {
    const directory = await open({ multiple: false, directory: true });

    if (!directory) return;

    if (!(await isPathInHome(directory))) {
        const home = await homeDir();
        createNotification({
            type: 'error',
            text: c('authenticator-2025:Error')
                .t`Cannot use this folder. Please pick a folder in your user's home directory (${home})`,
        });
        return;
    }

    return directory;
};

export const writeBackupToPath = async (path: string, password?: string): Promise<void> => {
    const allItems = await db.items.toSafeArray();
    const wasmItems = allItems
        .filter((item) => !item.syncMetadata || item.syncMetadata.state !== 'PendingToDelete')
        .map(toWasmEntry);

    const json = password
        ? service.export_entries_with_password(wasmItems, password)
        : service.export_entries(wasmItems);

    const buffer = new TextEncoder().encode(json);
    const fileHandle = await create(path);
    await fileHandle.write(buffer);
    await fileHandle.close();
};
