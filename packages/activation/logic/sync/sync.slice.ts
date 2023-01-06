import { createSlice } from '@reduxjs/toolkit';

import { changeCreateLoadingState, createSyncItem, deleteSyncItem, loadSyncList } from './sync.actions';
import { formatApiSync } from './sync.helpers';
import { SyncMap, SyncState } from './sync.interface';

const initialState: SyncState = { listLoading: 'idle', creatingLoading: 'idle', syncs: {} };

const syncSlice = createSlice({
    name: 'sync',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(changeCreateLoadingState, (state, action) => {
            state.creatingLoading = action.payload;
        });

        builder.addCase(createSyncItem.pending, (state) => {
            state.creatingLoading = 'pending';
        });

        builder.addCase(createSyncItem.rejected, (state, action) => {
            state.creatingLoading = 'failed';
            state.apiErrorCode = action.payload?.Code;
            state.apiErrorLabel = action.payload?.Error;
        });

        builder.addCase(createSyncItem.fulfilled, (state) => {
            state.creatingLoading = 'success';
            //reset error
            delete state.apiErrorCode;
            delete state.apiErrorLabel;
        });

        builder.addCase(loadSyncList.pending, (state) => {
            state.listLoading = 'pending';
        });

        builder.addCase(loadSyncList.rejected, (state) => {
            state.listLoading = 'failed';
        });

        builder.addCase(loadSyncList.fulfilled, (state, payload) => {
            state.listLoading = 'success';
            const syncs = formatApiSync(payload.payload.Syncs);

            const formattedSync = syncs.reduce<SyncMap>((acc, sync) => {
                acc[sync.id] = sync;
                return acc;
            }, {});

            state.syncs = formattedSync;
        });

        builder.addCase(deleteSyncItem.fulfilled, (state, action) => {
            const id = action.payload;
            delete state.syncs[id];
        });
    },
});

export default syncSlice.reducer;
