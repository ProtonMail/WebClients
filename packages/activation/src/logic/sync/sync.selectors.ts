import { createSelector } from '@reduxjs/toolkit';
import orderBy from 'lodash/orderBy';

import type { EasySwitchState } from '../store';
import type { SyncMap, SyncState } from './sync.interface';

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

export const selectSyncIdsByDate = createSelector(selectSync, (sync) =>
    orderBy(sync, 'startDate', 'desc').map((sync) => sync.id)
);

export const getAllSync = createSelector(selectSync, (syncs: SyncMap) => {
    return Object.values(syncs);
});
