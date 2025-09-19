import type { AuthenticatorImportResult } from '@protontech/authenticator-rust-core/worker';
import { downloadDir, join } from '@tauri-apps/api/path';
import { open, save } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { authService } from 'proton-authenticator/lib/auth/service';
import { clearBackupPassword, resolveBackupPassword } from 'proton-authenticator/lib/backup/password';
import {
    createAutomaticBackupFilename,
    createBackupFilename,
    pruneExcessBackups,
    writeBackupToPath,
} from 'proton-authenticator/lib/backup/writer';
import { db } from 'proton-authenticator/lib/db/db';
import { fromWasmEntry, fromWasmEntryOrdered } from 'proton-authenticator/lib/entries/items';
import { getNextOrder } from 'proton-authenticator/lib/entries/ordering';
import { addRemoteEntries, updateRemoteEntries } from 'proton-authenticator/lib/entries/sync';
import { getPathContent, prepareImport } from 'proton-authenticator/lib/importers/reader';
import type { ImportDTO, ImportResultDTO } from 'proton-authenticator/lib/importers/types';
import { SUPPORTED_IMPORTERS } from 'proton-authenticator/lib/importers/types';
import logger from 'proton-authenticator/lib/logger';
import { c, msgid } from 'ttag';

import type { Maybe } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { toggleBackup, updateSettings } from './settings';
import { createAppAsyncThunk } from './utils';

export const createBackup = createAppAsyncThunk(
    'entries/export',
    async (password: Maybe<string>, { extra: { createNotification } }) => {
        const path = await save({
            defaultPath: await join(await downloadDir(), createBackupFilename()),
            filters: [{ name: 'Export', extensions: ['json'] }],
        });

        if (path) {
            try {
                await writeBackupToPath(path, password);
                createNotification({ text: c('authenticator-2025:Info').t`Export created` });
            } catch (err) {
                createNotification({ text: c('authenticator-2025:Error').t`Failed to create export`, type: 'error' });
                logger.error(`[Entries::export] Failed to create export (${err})`);
            }
        }
    }
);

/** Called on every item edit/add/delete for the automatic backup feature.
 * Write backup file to disk. If there's already a file for the same day, overwrite it.
 * When there are more than 5 backup files in the directory, delete the oldest file(s). */
export const createAutomaticBackup = createAppAsyncThunk(
    'entries/automaticBackup',
    async (_, { dispatch, getState, extra: { createNotification } }) => {
        try {
            const { backupDirectory } = getState().settings;
            if (backupDirectory) {
                /** Handle edge case where directory was deleted by user */
                const directoryExists = await exists(backupDirectory);
                if (!directoryExists) {
                    await dispatch(toggleBackup({ enabled: false }));
                    return createNotification({
                        text: c('authenticator-2025:Warning')
                            .t`Automatic backup was disabled due to missing backup folder (${backupDirectory})`,
                    });
                }

                /** If we fail resolving the backup password, clear it
                 * and disable auto-backup for the user. */
                const onMissingBackupPassword = (err: any) => {
                    void dispatch(toggleBackup({ enabled: false }));
                    clearBackupPassword();
                    throw err;
                };

                const fullPath = await join(backupDirectory, createAutomaticBackupFilename());
                const backupPassword = await resolveBackupPassword().catch(onMissingBackupPassword);
                if (!backupPassword) onMissingBackupPassword(new Error('Unencrypted backup disabled'));

                await writeBackupToPath(fullPath, backupPassword);
                dispatch(updateSettings({ lastBackupEpoch: getEpoch() }));

                void pruneExcessBackups(backupDirectory);
            }
        } catch (err) {
            logger.error(`[Entries::automaticBackup] Failed to create export (${err})`);
        }
    }
);

export const importBackup = createAppAsyncThunk(
    'entries/import',
    async (
        { provider, password, path }: ImportDTO,
        { dispatch, extra: { createNotification } }
    ): Promise<void | ImportResultDTO> => {
        let totalImports = 0;

        const config = SUPPORTED_IMPORTERS[provider];
        if (!config) throw new Error('Unsupported provider');

        const paths: string[] = await (async () => {
            const result =
                path ??
                (await open({
                    filters: [{ name: '', extensions: config.extensions }],
                    multiple: config.multiple,
                }));

            if (!result) return [];
            return Array.isArray(result) ? result : [result];
        })();

        if (!paths.length) return;

        /** Password protected files will throw an error for `MissingPassword`
         * before the import sequence actually starts. This timer avoids UX
         * glitches where the `import-progress` notification shows too early */
        const notifyImportStart = () => {
            const timer = setTimeout(
                () =>
                    createNotification({
                        key: 'import-progress',
                        text:
                            paths.length > 1
                                ? c('authenticator-2025:Info').t`Importing codes from ${paths.length} files...`
                                : c('authenticator-2025:Info').t`Importing codes...`,
                    }),
                500
            );

            return { cancel: () => clearTimeout(timer) };
        };

        const timer = notifyImportStart();

        const importCodesFromPath = async (path: string): Promise<number> => {
            const parsed: Maybe<AuthenticatorImportResult> = await (async () => {
                const contents = await getPathContent(provider, path);
                return prepareImport(provider, path, contents, password);
            })();

            if (!parsed) return 0;

            if (parsed.errors.length) {
                const count = parsed.errors.length;
                createNotification({
                    text: c('authenticator-2025:Import').ngettext(
                        msgid`${count} item was skipped. HOTP isn’t currently supported.`,
                        `${count} items were skipped. HOTP isn't currently supported.`,
                        count
                    ),
                    type: 'warning',
                });
            }

            /** Handle import sequence where existing items may be overwritten
             * during local export import. Partition into updates vs inserts to
             * avoid IDB primary key constraint errors when using `bulkAdd` */
            const startOrder = await getNextOrder(db);
            const existingIds = new Set((await db.items.toSafeArray()).map(prop('id')));
            const [updates, upserts] = partition(parsed.entries, (entry) => existingIds.has(entry.id));
            const updatedItems = updates.map(fromWasmEntry);
            const newItems = upserts.map(fromWasmEntryOrdered(startOrder));

            if (newItems.length) {
                await db.items.bulkAdd(newItems);
                if (authService.getApi()) await addRemoteEntries(newItems).catch(noop);
            }

            if (updatedItems.length) {
                await db.items.bulkUpdate(updatedItems.map((item) => ({ key: item.id, changes: item })));
                if (authService.getApi()) {
                    const updatedIds = updatedItems.map(prop('id'));
                    const updatedLocalItems = (await db.items.bulkGet(updatedIds)).filter(truthy);
                    await updateRemoteEntries(updatedLocalItems).catch(noop);
                }
            }

            return newItems.length + updatedItems.length;
        };

        for (const path of paths) {
            try {
                totalImports += await importCodesFromPath(path);
            } catch (err) {
                if (err instanceof Error) {
                    timer.cancel();
                    if (err.message.includes('MissingPassword')) return { passwordRequired: true, path: paths };
                    if (err.message.includes('BadPassword')) {
                        return createNotification({
                            key: 'import-progress',
                            text: c('authenticator-2025:Error')
                                .t`Failed to import due to wrong password. Please try again.`,
                            type: 'error',
                        });
                    }
                }

                const filename = path.substring(path.lastIndexOf('/') + 1);
                createNotification({
                    text: c('authenticator-2025:Error').t`Codes from file "${filename}" could not be imported`,
                    type: 'error',
                });
                logger.error(`[Entries::import] Failed to import (${err})`);
            }
        }

        timer.cancel();

        if (totalImports > 0) {
            createNotification({
                key: 'import-progress',
                text: c('authenticator-2025:Import').ngettext(
                    msgid`Imported ${totalImports} code`,
                    `Imported ${totalImports} codes`,
                    totalImports
                ),
            });
            void dispatch(createAutomaticBackup());
        } else {
            createNotification({
                key: 'import-progress',
                text: c('authenticator-2025:Warning').t`Nothing to import.`,
            });
        }

        logger.info(`[Entries::import] Imported ${totalImports} item(s)`);
    }
);
