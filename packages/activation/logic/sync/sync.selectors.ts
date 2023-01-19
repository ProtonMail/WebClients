import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../store';
import { SyncMap, SyncState } from './sync.interface';

export const selectSyncStore = (state: EasySwitchState): SyncState => state.sync;
export const selectSync = (state: EasySwitchState): SyncMap => state.sync.syncs;

export const selectCreateSyncState = createSelector(selectSyncStore, (state) => state.creatingLoading);

export const selectSyncIds = createSelector(selectSync, (sync) => {
    return Object.keys(sync);
});

export const selectSyncById = createSelector(
    selectSync,
    (_: EasySwitchState, ID: string) => ID,
    (selectMap, ID) => selectMap[ID]
);
