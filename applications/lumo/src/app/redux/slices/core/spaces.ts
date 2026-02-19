import { createAction, createReducer, createSelector } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import type { Priority } from '../../../remote/scheduler';
import type { GetSpaceRemote, IdMapEntry, ListSpacesRemote, RemoteSpace } from '../../../remote/types';
import type { SerializedSpace, Space, SpaceId } from '../../../types';
import type { LumoState } from '../../store';

export type PushSpaceRequest = {
    id: SpaceId;
    priority?: Priority;
};
export type PushSpaceSuccess = PushSpaceRequest & {
    space?: Space;
    serializedSpace?: SerializedSpace;
    entry?: IdMapEntry;
};
export type PushSpaceFailure = PushSpaceRequest & {
    error: string;
};
export type PullSpaceRequest = {
    id: SpaceId;
};
export type DeleteAllSpacesFailure = {
    error: string;
};

export type PullSpaceFailure = PullSpaceRequest & {
    error?: string;
};

// Low-level Redux store operations without side-effects.
export const addSpace = createAction<Space>('lumo/space/add');
export const deleteSpace = createAction<SpaceId>('lumo/space/delete');
export const deleteAllSpaces = createAction('lumo/space/deleteAll');

// High-level Redux-saga requests and events.
export const pushSpaceRequest = createAction<PushSpaceRequest>('lumo/space/push/request');
export const pushSpaceSuccess = createAction<PushSpaceSuccess>('lumo/space/push/success');
export const pushSpaceNoop = createAction<PushSpaceRequest>('lumo/space/push/noop');
export const pushSpaceNeedsRetry = createAction<PushSpaceRequest>('lumo/space/push/needsRetry');
export const pushSpaceFailure = createAction<PushSpaceFailure>('lumo/space/push/failure');
export const locallyDeleteSpaceFromLocalRequest = createAction<SpaceId>('lumo/space/localDelete');
export const locallyDeleteSpaceFromRemoteRequest = createAction<SpaceId>('lumo/space/remoteDelete');
export const locallyRefreshSpaceFromRemoteRequest = createAction<RemoteSpace>('lumo/space/remoteRefresh');
export const pullSpaceRequest = createAction<PullSpaceRequest>('lumo/space/pull/request');
export const pullSpaceSuccess = createAction<GetSpaceRemote>('lumo/space/pull/success');
export const pullSpaceFailure = createAction<SpaceId>('lumo/space/pull/failure');
export const pullSpacesRequest = createAction('lumo/space/list/request');
export const pullSpacesPageResponse = createAction<ListSpacesRemote>('lumo/space/list/pageResponse');
export const pullSpacesSuccess = createAction('lumo/space/list/success');
export const pullSpacesFailure = createAction('lumo/space/list/failure');
export const deleteAllSpacesRequest = createAction<void>('lumo/space/deleteAll/request');
export const deleteAllSpacesSuccess = createAction<void>('lumo/space/deleteAll/success');
export const deleteAllSpacesFailure = createAction<DeleteAllSpacesFailure>('lumo/space/deleteAll/failure');

export type SpaceMap = Record<SpaceId, Space>;
export const EMPTY_SPACE_MAP: SpaceMap = {};
const initialState: SpaceMap = EMPTY_SPACE_MAP;

const spacesReducer = createReducer<SpaceMap>(initialState, (builder) => {
    builder
        .addCase(addSpace, (state, action) => {
            const space = action.payload;
            const existing = state[space.id];
            const existingLinkedFolder = existing?.isProject ? (existing as any).linkedDriveFolder : undefined;
            const newLinkedFolder = space.isProject ? (space as any).linkedDriveFolder : undefined;

            // Warn if we're losing linkedDriveFolder data
            if (existingLinkedFolder && !newLinkedFolder) {
                console.warn(`[addSpace] WARNING: Overwriting space ${space.id} and LOSING linkedDriveFolder!`, {
                    existingFolderId: existingLinkedFolder?.folderId,
                    newFolderId: newLinkedFolder?.folderId,
                    stack: new Error().stack
                });
            } else {
                console.log('Action triggered: addSpace', {
                    id: space.id,
                    isProject: space.isProject,
                    hasLinkedFolder: !!newLinkedFolder
                });
            }

            state[space.id] = space;
        })
        .addCase(deleteSpace, (state, action) => {
            console.log('Action triggered: deleteSpace', action.payload);
            const id = action.payload;
            delete state[id];
        })
        .addCase(deleteAllSpaces, () => {
            console.log('Action triggered: deleteAllSpaces');
            return EMPTY_SPACE_MAP;
        })
        .addCase(pullSpaceRequest, (state, action) => {
            console.log('Action triggered: pullSpaceRequest', action.payload);
            return state;
        })
        .addCase(pullSpaceSuccess, (state, action) => {
            console.log('Action triggered: pullSpaceSuccess', action.payload);
            return state;
        })
        .addCase(pullSpaceFailure, (state, action) => {
            console.log('Action triggered: pullSpaceFailure', action.payload);
            return state;
        })
        .addCase(pullSpacesPageResponse, (state) => {
            console.log('Action triggered: pullSpacesPageResponse');
            return state;
        })
        .addCase(pullSpacesRequest, (state) => {
            console.log('Action triggered: pullSpacesRequest');
            return state;
        })
        .addCase(pullSpacesSuccess, (state, action) => {
            console.log('Action triggered: pullSpacesSuccess', action.payload);
            return state;
        })
        .addCase(pullSpacesFailure, (state) => {
            console.log('Action triggered: pullSpacesFailure');
            return state;
        })
        .addCase(pushSpaceRequest, (state, action) => {
            console.log('Action triggered: pushSpaceRequest', action.payload);
            return state;
        })
        .addCase(pushSpaceSuccess, (state, action) => {
            console.log('Action triggered: pushSpaceSuccess', action.payload);
            return state;
        })
        .addCase(pushSpaceNoop, (state, action) => {
            console.log('Action triggered: pushSpaceNoop', action.payload);
            return state;
        })
        .addCase(pushSpaceNeedsRetry, (state, action) => {
            console.log('Action triggered: pushSpaceNeedsRetry', action.payload);
            return state;
        })
        .addCase(pushSpaceFailure, (state, action) => {
            console.log('Action triggered: pushSpaceFailure', action.payload);
            return state;
        })
        .addCase(locallyDeleteSpaceFromLocalRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteSpaceFromLocalRequest', action.payload);
            return state;
        })
        .addCase(locallyDeleteSpaceFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteSpaceFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(locallyRefreshSpaceFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyRefreshSpaceFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(deleteAllSpacesRequest, (state, action) => {
            console.log('Action triggered: deleteAllSpacesRequest', action.payload);
            return state;
        })
        .addCase(deleteAllSpacesSuccess, (state, action) => {
            console.log('Action triggered: deleteAllSpacesSuccess', action.payload);
            return state;
        })
        .addCase(deleteAllSpacesFailure, (state, action) => {
            console.log('Action triggered: deleteAllSpacesFailure', action.payload);
            return state;
        })
    ; // prettier-ignore
});

export function newSpaceId(): SpaceId {
    return uuidv4();
}

export const selectSpaceMap = (state: LumoState) => state.spaces;
export const selectHasSpaces = createSelector([selectSpaceMap], (spaceMap: SpaceMap) => {
    return !!spaceMap && Object.keys(spaceMap).length > 0;
});

export default spacesReducer;
