import { createAction, createReducer } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import type { Priority } from '../../../remote/scheduler';
import type { IdMapEntry } from '../../../remote/types';
import type { Asset, AssetId, SerializedAsset, SpaceId } from '../../../types';

export type PushAssetRequest = {
    id: AssetId;
    priority?: Priority;
};

export type PushAssetSuccess = PushAssetRequest & {
    asset?: Asset;
    serializedAsset?: SerializedAsset;
    entry?: IdMapEntry;
};

export type PushAssetFailure = PushAssetRequest & {
    error: string;
};

export type PullAssetRequest = {
    id: AssetId;
    spaceId: SpaceId;
};

// Low-level Redux store operations without side-effects.
export const upsertAsset = createAction<Asset>('lumo/asset/upsert');
export const deleteAsset = createAction<AssetId>('lumo/asset/delete');
export const deleteAllAssets = createAction('lumo/asset/deleteAll');
export const deleteAssetsBySpaceId = createAction<SpaceId>('lumo/asset/deleteBySpaceId');
export const addAsset = createAction<Asset>('lumo/asset/add');

// High-level Redux-saga requests and events.
export const pushAssetRequest = createAction<PushAssetRequest>('lumo/asset/pushRequest');
export const pushAssetSuccess = createAction<PushAssetSuccess>('lumo/asset/pushSuccess');
export const pushAssetNoop = createAction<PushAssetRequest>('lumo/asset/pushNoop');
export const pushAssetNeedsRetry = createAction<PushAssetRequest>('lumo/asset/pushNeedsRetry');
export const pushAssetFailure = createAction<PushAssetFailure>('lumo/asset/pushFailure');
export const locallyDeleteAssetFromLocalRequest = createAction<AssetId>('lumo/asset/locallyDeleteFromLocalRequest');
export const locallyDeleteAssetFromRemoteRequest = createAction<{ id: AssetId; spaceId: SpaceId }>('lumo/asset/locallyDeleteFromRemoteRequest');
export const pullAssetRequest = createAction<PullAssetRequest>('lumo/asset/pullRequest');
export const pullAssetSuccess = createAction<Asset>('lumo/asset/pullSuccess');
export const pullAssetFailure = createAction<AssetId>('lumo/asset/pullFailure');

export type AssetMap = Record<AssetId, Asset>;
export const EMPTY_ASSET_MAP = {};
export const EMPTY_ASSET_ARRAY = [];

const initialState: AssetMap = EMPTY_ASSET_MAP;
const assetsReducer = createReducer<AssetMap>(initialState, (builder) => {
    builder
        .addCase(upsertAsset, (state, action) => {
            const asset = action.payload;
            state[asset.id] = asset;
        })
        .addCase(addAsset, (state, action) => {
            const asset = action.payload;
            state[asset.id] = asset;
        })
        .addCase(deleteAsset, (state, action) => {
            console.log('Action triggered: deleteAsset', action.payload);
            const assetId = action.payload;
            delete state[assetId];
        })
        .addCase(deleteAssetsBySpaceId, (state, action) => {
            console.log('Action triggered: deleteAssetsBySpaceId', action.payload);
            const spaceId = action.payload;
            Object.keys(state).forEach((assetId) => {
                if (state[assetId].spaceId === spaceId) {
                    delete state[assetId];
                }
            });
        })
        .addCase(deleteAllAssets, () => {
            console.log('Action triggered: deleteAllAssets');
            return EMPTY_ASSET_MAP;
        });
});

export const newAssetId = (): AssetId => {
    return uuidv4();
};

export default assetsReducer;

