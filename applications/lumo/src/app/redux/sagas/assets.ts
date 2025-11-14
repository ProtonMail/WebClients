import type { SagaIterator } from 'redux-saga';
import { call, delay, getContext, put, select } from 'redux-saga/effects';

import type { AesGcmCryptoKey } from '../../crypto/types';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi, RemoteStatus } from '../../remote/api';
import { convertNewAssetToApi } from '../../remote/conversion';
import type { Priority } from '../../remote/scheduler';
import type { IdMapEntry, LocalId, RemoteId, ResourceType } from '../../remote/types';
import { deserializeAsset, serializeAsset } from '../../serialization';
import type {
    Asset,
    AssetId,
    DeletedAsset,
    SerializedAsset,
    SpaceId,
} from '../../types';
import { getSpaceDek } from '../../types';
import { selectAssetById, selectRemoteIdFromLocal, selectSpaceById } from '../selectors';
import {
    type PullAssetRequest,
    type PushAssetFailure,
    type PushAssetRequest,
    type PushAssetSuccess,
    addAsset,
    deleteAsset,
    locallyDeleteAssetFromRemoteRequest,
    pullAssetFailure,
    pullAssetSuccess,
    pushAssetFailure,
    pushAssetNeedsRetry,
    pushAssetNoop,
    pushAssetRequest,
    pushAssetSuccess,
} from '../slices/core/assets';
import { addIdMapEntry } from '../slices/core/idmap';
import { waitForMapping } from './idmap';
import { ClientError, RETRY_PUSH_EVERY_MS, isClientError } from './index';
import { waitForSpace } from './spaces';
import { getPendingAsset, removePendingAsset } from '../../services/files/pendingAssets';

/*** helpers ***/

// Deserialization helper for loading assets from IDB
export function* deserializeAssetSaga(
    serializedAsset: SerializedAsset,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<Asset> {
    const { id: localId, spaceId } = serializedAsset;

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(`deserializeAssetSaga ${localId}: space ${spaceId} not found`);
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    const asset: Asset | null = yield call(deserializeAsset, serializedAsset, spaceDek_);
    if (!asset) {
        throw new Error(`deserializeAssetSaga ${localId}: deserialization failed`);
    }
    return asset;
}

function* saveDirtyAsset(serializedAsset: SerializedAsset): SagaIterator {
    console.log('Saga triggered: saveDirtyAsset', serializedAsset);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, 'updateAsset'], serializedAsset, {
        dirty: true,
    });
}

function* deleteAssetFromIdb(assetId: AssetId): SagaIterator<any> {
    console.log('Saga triggered: deleteAssetFromIdb', assetId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, 'deleteAsset'], assetId);
}

// Helper function removed - inlined to avoid generator issues with return values

/*** redux actions ***/

export function* handlePushAssetRequest({ payload: request }: { payload: PushAssetRequest }): SagaIterator<any> {
    console.log('Saga triggered: handlePushAssetRequest', request);
    const { id: localId, priority = 'background' } = request;
    const type: ResourceType = 'asset';
    const dbApi: DbApi = yield getContext('dbApi');
    const remoteId: RemoteId | undefined = yield select(selectRemoteIdFromLocal(type, localId));
    const idbAsset: SerializedAsset | undefined = yield call([dbApi, dbApi.getAssetById], localId);

    // Deletion case - check if asset is marked as deleted in IDB
    if (idbAsset) {
        const { deleted, dirty } = idbAsset;
        if (deleted) {
            if (dirty) {
                // DELETE - asset is marked as deleted and needs to be synced
                if (remoteId) {
                    try {
                        yield call(httpDeleteAsset, localId, remoteId, priority);
                        // Clear the dirty flag in IDB, marking the deletion was synced
                        yield call([dbApi, dbApi.updateAsset], idbAsset, { dirty: false });
                        yield put(pushAssetSuccess({ id: localId }));
                    } catch (e) {
                        console.error(`Error deleting asset ${localId}:`, e);
                        if (isClientError(e)) {
                            yield put(pushAssetFailure({ id: localId, error: (e as Error).message }));
                        } else {
                            yield put(pushAssetNeedsRetry(request));
                        }
                    }
                } else {
                    // No remote ID, just mark as synced locally
                    yield call([dbApi, dbApi.updateAsset], idbAsset, { dirty: false });
                    yield put(pushAssetSuccess({ id: localId }));
                }
                return;
            } else {
                // Deletion was already synced, noop
                yield put(pushAssetNoop(request));
                return;
            }
        }
    }

    // Normal push case - asset exists and is not deleted
    // First check if there's a pending asset with full data (from initial upload)
    let asset: Asset | undefined = getPendingAsset(localId);
    
    // If not in pending map, fetch from Redux (retry scenario)
    if (!asset) {
        asset = yield select(selectAssetById(localId));
    }
    
    if (!asset) {
        console.warn(`asset ${localId} does not exist`);
        return;
    }

    // Get the space and derive the encryption key
    yield call(waitForSpace, asset.spaceId);
    const space = yield select(selectSpaceById(asset.spaceId));
    
    if (!space) {
        console.error(`Space ${asset.spaceId} not found for asset ${localId}`);
        yield put(pushAssetFailure({ id: localId, error: 'Parent space not found' }));
        return;
    }
    
    const dek: AesGcmCryptoKey = yield call(getSpaceDek, space);
    const serializedAsset: SerializedAsset | null = yield call(serializeAsset, asset, dek);
    
    if (!serializedAsset) {
        console.error(`Failed to serialize asset ${localId}`);
        yield put(pushAssetFailure({ id: localId, error: 'Failed to serialize asset' }));
        return;
    }

    try {
        if (remoteId) {
            const success: PushAssetSuccess = yield call(httpPutAsset, serializedAsset, remoteId, priority);
            yield put(pushAssetSuccess(success));
        } else {
            const success: PushAssetSuccess = yield call(httpPostAsset, serializedAsset, priority);
            yield put(pushAssetSuccess(success));
        }
    } catch (e) {
        console.error(`Error pushing asset ${localId}:`, e);
        if (isClientError(e)) {
            yield put(pushAssetFailure({ id: localId, error: (e as Error).message }));
        } else {
            yield put(pushAssetNeedsRetry(request));
        }
    }
}

export function* handlePushAssetSuccess({ payload: success }: { payload: PushAssetSuccess }): SagaIterator<any> {
    console.log('Saga triggered: handlePushAssetSuccess', success);
    const { id: localId } = success;
    
    // Clean up pending asset after successful push
    removePendingAsset(localId);
    
    const asset: Asset = yield select(selectAssetById(localId));
    if (!asset) {
        console.warn(`asset ${localId} does not exist`);
        return;
    }

    // Get the space and derive the encryption key
    yield call(waitForSpace, asset.spaceId);
    const space = yield select(selectSpaceById(asset.spaceId));
    const dek: AesGcmCryptoKey = yield call(getSpaceDek, space);
    
    console.log(`Serializing asset ${localId} for IDB persistence...`);
    const serializedAsset: SerializedAsset = yield call(serializeAsset, asset, dek);

    const cleanedSerialized = { ...serializedAsset, dirty: false };
    console.log(`Saving asset ${localId} to IndexedDB...`);
    yield call(saveDirtyAsset, cleanedSerialized);
    console.log(`Asset ${localId} saved to IndexedDB successfully`);
}

export function* handlePushAssetNeedsRetry({ payload: request }: { payload: PushAssetRequest }): SagaIterator<any> {
    console.log('Saga triggered: handlePushAssetNeedsRetry', request);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield put(pushAssetRequest(request));
}

export function* handlePushAssetFailure({ payload: failure }: { payload: PushAssetFailure }): SagaIterator<any> {
    console.error('Saga triggered: handlePushAssetFailure', failure);
    const { id: localId } = failure;
    
    // Clean up pending asset on failure
    removePendingAsset(localId);
    
    yield call(deleteAssetFromIdb, localId);
    yield put(deleteAsset(localId));
}

export function* handleLocallyDeleteAssetFromLocalRequest({ payload: assetId }: { payload: AssetId }): SagaIterator<any> {
    console.log('Saga triggered: handleLocallyDeleteAssetFromLocalRequest', assetId);
    const asset: Asset = yield select(selectAssetById(assetId));
    if (!asset) {
        console.warn(`asset ${assetId} does not exist`);
        return;
    }

    // Get the space and derive the encryption key
    yield call(waitForSpace, asset.spaceId);
    const space = yield select(selectSpaceById(asset.spaceId));
    const dek: AesGcmCryptoKey = yield call(getSpaceDek, space);
    
    const serializedAsset: SerializedAsset | null = yield call(serializeAsset, asset, dek);
    if (!serializedAsset) {
        console.error(`Failed to serialize asset ${assetId} for deletion`);
        return;
    }
    const { encrypted, ...rest } = serializedAsset;
    const deletedAsset: DeletedAsset = { ...rest, deleted: true, dirty: true };

    // Mark as deleted in IDB with dirty flag
    yield call(saveDirtyAsset, deletedAsset);
    
    // Remove from Redux
    yield put(deleteAsset(assetId));

    // Dispatch pushAssetRequest to sync deletion to remote (with retry logic)
    yield put(pushAssetRequest({ id: assetId, priority: 'urgent' }));
}

export function* softDeleteAssetFromRemote({ payload: { id: assetId, spaceId } }: { payload: { id: AssetId; spaceId: SpaceId } }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteAssetFromRemote', { assetId, spaceId });
    const dbApi: DbApi = yield getContext('dbApi');
    
    // Remove from Redux first
    yield put(deleteAsset(assetId));
    
    // Mark as deleted in IDB (already synced remotely, so dirty: false)
    // If asset doesn't exist in IDB, create a minimal deleted record to prevent it from being loaded on reload
    const existingAsset = yield call([dbApi, dbApi.getAssetById], assetId);
    if (!existingAsset) {
        // Asset doesn't exist in IDB - create a minimal deleted record
        const deletedAsset: SerializedAsset = {
            id: assetId,
            spaceId,
            deleted: true,
            dirty: false,
            uploadedAt: new Date().toISOString(), // Use current time as fallback
        } as SerializedAsset;
        yield call([dbApi, dbApi.addAsset], deletedAsset, { dirty: false });
        console.log(`Created minimal deleted record for asset ${assetId} in IDB`);
        return;
    }
    
    // Asset exists - mark as deleted
    if (existingAsset.deleted === true) {
        console.log(`Asset ${assetId} already marked as deleted, skipping`);
        return;
    }
    
    yield call([dbApi, dbApi.softDeleteAsset], assetId, { dirty: false });
}

/*** sync: local -> remote ***/

function* httpPostAsset(serializedAsset: SerializedAsset, priority: Priority): SagaIterator<PushAssetSuccess> {
    console.log('Saga triggered: httpPostAsset', serializedAsset);
    const type: ResourceType = 'asset';
    const { id: localId, spaceId: localSpaceId } = serializedAsset;

    console.log(`Waiting for space ${localSpaceId} to be mapped to remote...`);
    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    console.log(`Space ${localSpaceId} mapped to remote ${remoteSpaceId}`);
    
    const assetToApi = convertNewAssetToApi(serializedAsset, remoteSpaceId);
    console.log(`Calling lumoApi.postAsset with:`, assetToApi);
    
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postAsset], assetToApi, priority);
    console.log(`lumoApi.postAsset returned remoteId:`, remoteId);
    
    if (!remoteId) {
        throw new ClientError(`client error while posting ${type} ${localId}, not retrying`);
    }
    const entry: IdMapEntry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return { id: localId, serializedAsset, entry };
}

function* httpPutAsset(
    serializedAsset: SerializedAsset,
    remoteId: RemoteId,
    priority: Priority
): SagaIterator<PushAssetSuccess> {
    console.log('Saga triggered: httpPutAsset', serializedAsset, remoteId);
    const type: ResourceType = 'asset';
    const { id: localId, spaceId: localSpaceId } = serializedAsset;

    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    const assetToApi = convertNewAssetToApi(serializedAsset, remoteSpaceId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const status: RemoteStatus = yield call([lumoApi, lumoApi.putAsset], assetToApi, remoteId, priority);
    if (!status) {
        throw new ClientError(`client error while putting ${type} ${localId}, not retrying`);
    }
    return { id: localId, serializedAsset };
}

function* httpDeleteAsset(localId: LocalId, remoteId: RemoteId, priority: Priority): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpDeleteAsset', localId, remoteId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    return yield call([lumoApi, lumoApi.deleteAsset], remoteId, priority);
}

export function* handlePullAssetRequest({ payload: request }: { payload: PullAssetRequest }): SagaIterator<any> {
    console.log('Saga triggered: handlePullAssetRequest', request);
    const { id: assetId, spaceId } = request;

    try {
        // Check if asset is already marked as deleted in IDB before pulling
        const dbApi: DbApi = yield getContext('dbApi');
        const idbAsset: SerializedAsset | undefined = yield call([dbApi, dbApi.getAssetById], assetId);
        if (idbAsset?.deleted === true) {
            console.log(`Asset ${assetId} is marked as deleted in IDB, skipping pull`);
            // Ensure it's removed from Redux if it exists
            yield put(deleteAsset(assetId));
            return;
        }

        // Get the space and derive the encryption key
        yield call(waitForSpace, spaceId);
        const space = yield select(selectSpaceById(spaceId));
        const dek: AesGcmCryptoKey = yield call(getSpaceDek, space);
        
        // Look up remoteId from idmap (like attachments do)
        const remoteId: RemoteId | undefined = yield select(selectRemoteIdFromLocal('asset', assetId));
        if (!remoteId) {
            console.error(`GET asset ${assetId}: Remote ID not found in idmap`);
            yield put(pullAssetFailure(assetId));
            return;
        }
        
        const lumoApi: LumoApi = yield getContext('lumoApi');
        const remoteAsset = yield call([lumoApi, lumoApi.getAsset], remoteId, spaceId);
        if (!remoteAsset) {
            throw new Error('Asset not found on remote');
        }

        // Check if remote asset is deleted
        if (remoteAsset.deleted === true) {
            console.log(`Remote asset ${assetId} is deleted, marking as deleted locally`);
            yield put(locallyDeleteAssetFromRemoteRequest({ id: assetId, spaceId }));
            return;
        }

        const asset: Asset = yield call(deserializeAsset, remoteAsset, dek);
        
        // Remove binary data before storing in Redux (but keep markdown for LLM context)
        // This avoids non-serializable Uint8Array in Redux state
        const { data, ...assetForRedux } = asset;
        
        // Add asset to Redux store (without binary data, but with markdown for LLM)
        yield put(addAsset(assetForRedux));
        yield put(pullAssetSuccess(assetForRedux));

        // Serialize the full asset (with data) for IndexedDB persistence
        const serializedAsset: SerializedAsset = yield call(serializeAsset, asset, dek);
        yield call(saveDirtyAsset, serializedAsset);
    } catch (e) {
        console.error('Failed to pull asset:', e);
        yield put(pullAssetFailure(assetId));
    }
}

export function* logPullAssetFailure({ payload: assetId }: { payload: AssetId }): SagaIterator<any> {
    console.error(`get asset ${assetId} failure`);
}

