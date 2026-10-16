import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import type { CoreEventV6Response } from '@proton/shared/lib/api/events';

import type { ApiEvent } from '../api/api.interface';
import { loadImporters } from './importers/importers.actions';
import { loadReports } from './reports/reports.actions';
import type { EasySwitchThunkExtra } from './store';
import { loadSyncList } from './sync/sync.actions';

export const event = createAction<ApiEvent>('event');

export const loadDashboard = createAsyncThunk<void, undefined, EasySwitchThunkExtra>(
    'dashboard/load',
    async (_, thunkApi) => {
        const results = await Promise.all([
            thunkApi.dispatch(loadSyncList()),
            thunkApi.dispatch(loadReports()),
            thunkApi.dispatch(loadImporters()),
        ]);

        // Dispatching a thunk never throws, so a failing request has to be surfaced here for callers using unwrap()
        if (results.some((result) => result.meta.requestStatus === 'rejected')) {
            throw new Error('Failed to load the dashboard');
        }
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
