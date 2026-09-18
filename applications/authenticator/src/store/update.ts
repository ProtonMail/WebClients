import { createSlice } from '@reduxjs/toolkit';
import type { Update } from '@tauri-apps/plugin-updater';

import noop from '@proton/utils/noop';

import app from '../lib/app';
import { createAppAsyncThunk } from './utils';

type UpdateState = {
    updatePackage?: Update;
};

const initialState: UpdateState = {};

export const checkForUpdates = createAppAsyncThunk('update/checkForUpdates', () => app.checkForUpdates().catch(noop));

const updateSlice = createSlice({
    name: 'update',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(checkForUpdates.fulfilled, (state, { payload }) => {
            state.updatePackage = payload;
        });
    },
});

export default updateSlice.reducer;
