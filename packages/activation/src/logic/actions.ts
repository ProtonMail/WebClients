import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import type { ApiEvent } from '@proton/activation/src/api/api.interface';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';

import { loadImporters } from './importers/importers.actions';
import { loadReports } from './reports/reports.actions';
import type { EasySwitchThunkExtra } from './store';
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

export const eventLoopV6 = createAsyncThunk<void, CoreEventV6Response, EasySwitchThunkExtra>(
    'eventLoopV6',
    async (coreEventLoopV6, thunkApi) => {
        if (coreEventLoopV6.Imports || coreEventLoopV6.ImportReports || coreEventLoopV6.ImporterSyncs) {
            await Promise.all([
                coreEventLoopV6.Imports ? thunkApi.dispatch(loadImporters()) : undefined,
                coreEventLoopV6.ImportReports ? thunkApi.dispatch(loadReports()) : undefined,
                coreEventLoopV6.ImporterSyncs ? thunkApi.dispatch(loadSyncList()) : undefined,
            ]);
        }
    }
);
