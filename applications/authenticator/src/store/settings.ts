import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { clearBackupPassword, saveBackupPassword } from 'proton-authenticator/lib/backup/password';
import type { ToggleBackupDTO } from 'proton-authenticator/lib/backup/types';
import { promptValidBackupDirectory } from 'proton-authenticator/lib/backup/writer';
import biometrics from 'proton-authenticator/lib/locks/biometrics';
import password from 'proton-authenticator/lib/locks/password';
import type { AppLock, AppLockDTO } from 'proton-authenticator/lib/locks/types';
import logger from 'proton-authenticator/lib/logger';
import { c } from 'ttag';

import { createAppAsyncThunk } from './utils';

type Theme = 'auto' | 'dark' | 'light';

export type Settings = {
    animateCodes: boolean;
    hideCodes: boolean;
    appLock: AppLock;
    digitStyle: 'plain' | 'boxed';
    theme: Theme;
    backupDirectory?: string;
    lastBackupEpoch?: number;
};

export const INITIAL_SETTINGS: Settings = {
    animateCodes: false,
    hideCodes: false,
    appLock: 'none',
    digitStyle: 'plain',
    theme: 'auto',
};

const PERISTENCE_KEY = 'settings';

export const getPersistedSettings = (): Partial<Settings> => {
    try {
        return JSON.parse(localStorage.getItem(PERISTENCE_KEY) ?? '{}');
    } catch {
        logger.error('[Settings::getPersistedSettings] Failed to parse persisted settings');
        return {};
    }
};

export const persistSettings = (settings: Settings) => {
    try {
        const value = JSON.stringify(settings);
        localStorage.setItem(PERISTENCE_KEY, value);
    } catch {
        logger.error('[Settings::persistSettings] Failed to persist settings');
    }
};

export const updateLock = createAppAsyncThunk(
    'settings/updateLock',
    async (newLock: AppLockDTO, { getState, extra: { createNotification } }) => {
        const { appLock: current } = getState().settings;

        switch (newLock.mode) {
            case 'password':
                await password.setup(newLock.password);
                break;
            case 'biometrics':
                await biometrics.setup();
                break;
            case 'none':
                if (current === 'biometrics') await biometrics.verify(c('authenticator-2025:Reason').t`disable lock`);
                else if (current === 'password') await password.clear();
                break;
            default:
                throw new Error('Not implemented');
        }

        createNotification({ text: c('authenticator-2025:Info').t`Lock updated` });
        return newLock.mode;
    }
);

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: () => {
        const persistedValues = getPersistedSettings();

        return {
            ...INITIAL_SETTINGS,
            ...persistedValues,
        };
    },
    reducers: {
        update: (state, action: PayloadAction<Partial<Omit<Settings, 'appLock'>>>) => {
            const newState = {
                ...state,
                ...action.payload,
            };

            persistSettings(newState);

            return newState;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(updateLock.fulfilled, (state, action) => {
            state.appLock = action.payload;
            persistSettings(state);
        });
    },
});

export const { update: updateSettings } = settingsSlice.actions;

export const toggleBackup = createAppAsyncThunk(
    'settings/toggleBackup',
    async (payload: ToggleBackupDTO, { dispatch, extra: { createNotification } }) => {
        if (payload.enabled) {
            const backupDirectory = await promptValidBackupDirectory(createNotification);
            if (backupDirectory && payload.password) {
                await saveBackupPassword(payload.password);
                dispatch(updateSettings({ backupDirectory }));
            }
        } else {
            dispatch(updateSettings({ backupDirectory: undefined, lastBackupEpoch: undefined }));
            clearBackupPassword();
        }
    }
);

export const changeBackupDirectory = createAppAsyncThunk(
    'settings/changeBackupDirectory',
    async (_, { dispatch, extra: { createNotification } }) => {
        const backupDirectory = await promptValidBackupDirectory(createNotification);
        if (backupDirectory) dispatch(updateSettings({ backupDirectory }));
    }
);

export default settingsSlice.reducer;
