import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { loadImporters } from './importers/importers.actions';
import { loadReports } from './reports/reports.actions';
import { EasySwitchThunkExtra } from './store';
import { ApiEvent } from './types/events.types';

export const event = createAction<ApiEvent>('event');

export const loadDashboard = createAsyncThunk<void, undefined, EasySwitchThunkExtra>(
    'dashboard/load',
    async (_, thunkApi) => {
        await Promise.all([thunkApi.dispatch(loadReports()), thunkApi.dispatch(loadImporters())]);
    }
);
