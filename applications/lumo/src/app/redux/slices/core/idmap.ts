import { createAction, createReducer } from '@reduxjs/toolkit';

import { type IdMapEntry, type LocalId, type RemoteId, type ResourceType } from '../../../remote/types';

export type IdMap = {
    local2remote: Record<ResourceType, Record<LocalId, RemoteId>>;
    remote2local: Record<ResourceType, Record<RemoteId, LocalId>>;
};
export const EMPTY_ID_MAP = {
    local2remote: {
        space: {},
        conversation: {},
        message: {},
        attachment: {},
    } satisfies Record<ResourceType, Record<RemoteId, LocalId>>,
    remote2local: {
        space: {},
        conversation: {},
        message: {},
        attachment: {},
    } satisfies Record<ResourceType, Record<RemoteId, LocalId>>,
};

export const addIdMapEntry = createAction<IdMapEntry & { saveToIdb: boolean }>('lumo/idmap/add');
export const deleteAllIdMaps = createAction('lumo/idmap/deleteAll');

const initialState: IdMap = EMPTY_ID_MAP;
const idMapReducer = createReducer<IdMap>(initialState, (builder) => {
    builder.addCase(addIdMapEntry, (state, action) => {
        console.log('Action triggered: addIdMapEntry', action.payload);
        const { localId, remoteId, type } = action.payload;
        state.local2remote[type][localId] = remoteId;
        state.remote2local[type][remoteId] = localId;
    });
    builder.addCase(deleteAllIdMaps, () => {
        console.log('Action triggered: deleteAllIdMaps');
        return EMPTY_ID_MAP;
    });
});

export default idMapReducer;
