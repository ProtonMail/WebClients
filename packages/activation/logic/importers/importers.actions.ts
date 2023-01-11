import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { cancelImport, getImportsList } from '@proton/activation/api';
import { ApiImportListResponse } from '@proton/activation/api/api.interface';

import { EasySwitchThunkExtra } from '../store';
import { ActiveImportID } from './importers.interface';

export const loadImporters = createAsyncThunk<ApiImportListResponse, undefined, EasySwitchThunkExtra>(
    'importers/load',
    async (_, thunkApi) => {
        const importers = await thunkApi.extra.api<ApiImportListResponse>(getImportsList());
        return importers;
    }
);

export const cancelImporter = createAsyncThunk<void, { activeImporterID: ActiveImportID }, EasySwitchThunkExtra>(
    'importers/cancel',
    async ({ activeImporterID }, thunkApi) => {
        const state = thunkApi.getState();
        const activeImporter = state.importers.activeImporters[activeImporterID];

        await thunkApi.extra.api(
            cancelImport({
                ImporterID: activeImporter.importerID,
                Products: [activeImporter.product],
            })
        );
        await thunkApi.extra.eventManager.call();

        thunkApi.extra.notificationManager.createNotification({ text: c('Success').t`Canceling import` });
    }
);
