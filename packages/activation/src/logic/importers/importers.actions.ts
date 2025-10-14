import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { cancelImport, getImportsList } from '@proton/activation/src/api';
import type { ApiImportListResponse } from '@proton/activation/src/api/api.interface';
import { getEasySwitchFeaturesFromProducts } from '@proton/activation/src/hooks/useOAuthPopup.helpers';

import type { EasySwitchThunkExtra } from '../store';
import type { ActiveImportID } from './importers.interface';

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
                Features: getEasySwitchFeaturesFromProducts([activeImporter.product]),
            })
        );
        await thunkApi.extra.eventManager.call();

        thunkApi.extra.notificationManager.createNotification({ text: c('Success').t`Canceling import` });
    }
);
