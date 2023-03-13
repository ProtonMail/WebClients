import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ApiEvent } from '@proton/activation/src/api/api.interface';

import { loadImporters } from './importers/importers.actions';
import { loadReports } from './reports/reports.actions';
import { EasySwitchThunkExtra } from './store';
import { loadSyncList } from './sync/sync.actions';

export const event = createAction<ApiEvent>('event');

export const loadDashboard = createAsyncThunk<void, undefined, EasySwitchThunkExtra>(
    'dashboard/load',
    async (_, thunkApi) => {
        await Promise.all([
            thunkApi.dispatch(loadSyncList()),
            thunkApi.dispatch(loadReports()),
            thunkApi.dispatch(loadImporters()),
        ]);
    }
);
