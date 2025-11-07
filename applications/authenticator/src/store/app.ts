import type { PayloadAction, SerializedError } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { getBackupPassword } from 'proton-authenticator/lib/backup/password';
import { pruneExcessBackups, readCurrentBackups } from 'proton-authenticator/lib/backup/writer';
import { StorageKey, db, setupDB } from 'proton-authenticator/lib/db/db';
import { V4_MIGRATION_BACK_UP_ID } from 'proton-authenticator/lib/db/migrations/v4';
import logger from 'proton-authenticator/lib/logger';
import { STORAGE_KEY_IDB_ID } from 'proton-authenticator/lib/storage-key/constants';
import { StorageKeySource } from 'proton-authenticator/lib/storage-key/types';
import { loadWasm } from 'proton-authenticator/lib/wasm/service';
import { resumeSession } from 'proton-authenticator/store/auth';
import { updateSettings } from 'proton-authenticator/store/settings';
import { c, msgid } from 'ttag';

import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { checkForUpdates } from './update';
import { createAppAsyncThunk } from './utils';

export type AppStatus = 'launch' | 'locked' | 'ready' | 'booting' | 'error';
export type AppState = { status: AppStatus; error?: SerializedError };

const initialState: AppState = { status: 'launch' };

export const boot = createAppAsyncThunk(
    'app/boot',
    async (_, { dispatch, getState, extra: { createModal } }): Promise<void> => {
        const keyRef = await db.storageKey.get(STORAGE_KEY_IDB_ID);
        const backup = await db.backup.get(V4_MIGRATION_BACK_UP_ID);
        const appLock = getState().settings.appLock;

        await StorageKey.init({
            keyRef,
            /** If the user had a password lock setup and updated the app
             * then the StorageKeySource can be set to password-derived. */
            default: appLock === 'password' ? StorageKeySource.PASSWORD : undefined,
            confirm: ({ message, cancelable, operation, warning }) =>
                createModal({
                    message,
                    warning,
                    title: c('authenticator-2025:Title').t`Storage key issue`,
                    cancelable,
                    submitText: c('authenticator-2025:Action').t`Try again`,
                    cancelText:
                        operation === 'generate'
                            ? /** cancellation would mean downgrading the key
                               * to an unsafe storage key source */
                              c('authenticator-2025:Action').t`Continue anyway`
                            : c('authenticator-2025:Action').t`Reset`,
                }),
        });

        if (db.verno >= 4 && backup) {
            logger.info(`[db::migration] Migrating backup "${backup.id}"`);
            /** If we have a backup for `V4_MIGRATION_BACK_UP_ID`
             * then we now need to re-encrypt all user-data with
             * the newly generated `StorageKey`. */
            if (backup.items.length) await db.items.bulkAdd(backup.items);
            if (backup.keys.length) await db.keys.bulkAdd(backup.keys);
            await db.backup.clear();

            const itemsCount = backup.items.length;
            const keysCount = backup.keys.length;
            logger.info(`[db::migration] Migrated ${itemsCount} items & ${keysCount} keys`);
        }

        try {
            /** auto disable if the user had unencrypted automatic export enabled */
            const { backupDirectory } = getState().settings;
            const upgradeAutomaticBackup = backupDirectory !== undefined && getBackupPassword() === null;

            if (upgradeAutomaticBackup) {
                const backupsCount = (await readCurrentBackups(backupDirectory)).length;
                const promptForRemoval = backupsCount > 0;

                dispatch(
                    updateSettings({
                        backupDirectory: undefined,
                        lastBackupEpoch: undefined,
                    })
                );

                const confirm = await createModal({
                    title: c('authenticator-2025:Title').t`Encrypted backup is now available`,
                    message: c('authenticator-2025:Warning')
                        .t`For enhanced security, un-encrypted automatic backup has been disabled. You can re-enable it in the Settings.`,
                    warning: promptForRemoval
                        ? c('authenticator-2025:Warning').ngettext(
                              msgid`You have ${backupsCount} previous backup on your device that can be removed.`,
                              `You have ${backupsCount} previous backups on your device that can be removed.`,
                              backupsCount
                          )
                        : undefined,
                    cancelable: promptForRemoval,
                    submitText: promptForRemoval
                        ? c('authenticator-2025:Action').t`Remove previous backups`
                        : c('authenticator-2025:Action').t`Got it`,
                    cancelText: c('authenticator-2025:Action').t`Continue anyways`,
                });

                /** Remove all backups with `max=0` if user agrees */
                if (promptForRemoval && confirm) await pruneExcessBackups(backupDirectory, 0);
            }
        } catch {}

        void dispatch(resumeSession());
    }
);

export const init = createAppAsyncThunk('app/init', async (_, { getState, dispatch }): Promise<Partial<AppState>> => {
    try {
        const { appLock } = getState().settings;
        void dispatch(checkForUpdates());

        await Promise.all([loadCryptoWorker(), loadWasm(), setupDB()]);

        logger.info('[app::init] completed');

        /** If the app should be locked bail-out from dispatching
         * the subsequent `boot` action. Booting requires unlock */
        if (appLock !== 'none') return { status: 'locked' };

        void dispatch(boot());
        return {};
    } catch (err) {
        logger.warn(`[app::init] failure ${err}`);
        throw err;
    }
});

const appStateSlice = createSlice({
    name: 'app',
    initialState,
    reducers: { setStatus: (state, action: PayloadAction<AppStatus>) => ({ ...state, status: action.payload }) },
    extraReducers: (builder) => {
        builder
            .addCase(init.fulfilled, (state, { payload }) => ({ ...state, ...payload }))
            .addCase(init.rejected, (state, action) => ({ ...state, status: 'error', error: action.error }))
            .addCase(boot.fulfilled, (state) => ({ ...state, status: 'ready', error: undefined }))
            .addCase(boot.rejected, (state, action) => ({ ...state, status: 'error', error: action.error }));
    },
});

export const setAppStatus = appStateSlice.actions.setStatus;
export default appStateSlice.reducer;
