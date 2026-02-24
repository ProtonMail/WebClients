import isEqual from 'lodash/isEqual';
import type { SagaIterator } from 'redux-saga';
import { call, delay, fork, getContext, put, select, take } from 'redux-saga/effects';

import type { AesGcmCryptoKey } from '../../crypto/types';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi, RemoteStatus } from '../../remote/api';
import { convertNewAttachmentToApi } from '../../remote/conversion';
import type { Priority } from '../../remote/scheduler';
import type {
    IdMapEntry,
    LocalId,
    RemoteDeletedAttachment,
    RemoteFilledAttachment,
    RemoteId,
    ResourceType,
} from '../../remote/types';
import { deserializeAttachment, deserializeFilledAttachment, serializeAttachment } from '../../serialization';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import {
    type Attachment,
    type AttachmentId,
    type SerializedAttachment,
    type Space,
    cleanAttachment,
    getSpaceDek,
} from '../../types';
import { selectAttachmentById, selectRemoteIdFromLocal, selectSpaceById } from '../selectors';
import { clearAttachmentLoading, setAttachmentError, setAttachmentLoading } from '../slices/attachmentLoadingState';
import {
    type IndexAttachmentRequest,
    type PullAttachmentRequest,
    type PushAttachmentFailure,
    type PushAttachmentRequest,
    type PushAttachmentSuccess,
    type RemoteShallowAttachmentRequest,
    type UnindexAttachmentRequest,
    addAttachment,
    deleteAttachment,
    indexAttachmentRequest,
    locallyDeleteAttachmentFromRemoteRequest,
    locallyRefreshFilledAttachmentFromRemoteRequest,
    pullAttachmentFailure,
    pullAttachmentRequest,
    pullAttachmentSuccess,
    pushAttachmentFailure,
    pushAttachmentNeedsRetry,
    pushAttachmentNoop,
    pushAttachmentRequest,
    pushAttachmentSuccess,
    unindexAttachmentRequest,
} from '../slices/core/attachments';
import { addIdMapEntry } from '../slices/core/idmap';
import type { LumoState } from '../store';
import { waitForMapping } from './idmap';
import { ClientError, RETRY_PUSH_EVERY_MS, callWithRetry, isClientError, isConflictClientError } from './index';
import { waitForSpace } from './spaces';

/*** helpers ***/

function* saveDirtyAttachment(serializedAttachment: SerializedAttachment): SagaIterator {
    console.log('Saga triggered: saveDirtyAttachment', serializedAttachment);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.updateAttachment], serializedAttachment, {
        dirty: true,
    });
}

function* clearDirtyIfUnchanged(serializedAttachment: SerializedAttachment): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirtyIfUnchanged', serializedAttachment);
    // fixme: possibly racy between getting `idbAttachment` and storing the object
    // fixme: consider delegating the CAS to dbApi instead, which can manage the read-then-write inside a tx
    const dbApi: DbApi = yield getContext('dbApi');
    const localId = serializedAttachment.id;
    const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);
    if (!idbAttachment) {
        console.log(`clearDirtyIfUnchanged: attachment ${localId} not found in IDB, cannot clear`);
        return false;
    }
    const { dirty: _a, ...a } = cleanAttachmentSerialized(idbAttachment);
    const { dirty: _b, ...b } = cleanAttachmentSerialized(serializedAttachment);
    const unchanged = isEqual(a, b);
    // todo improvement: dbApi.clearDirtyAttachment() directly there
    if (unchanged) {
        yield call([dbApi, dbApi.updateAttachment], serializedAttachment, { dirty: false });
        return true;
    } else {
        console.log('clearDirtyIfUnchanged: found changed data: ', { a, b });
        return false;
    }
}

function* clearDirtyUnconditionally(localId: AttachmentId): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirty', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);
    if (!idbAttachment) {
        console.log(`clearDirty: attachment ${localId} not found in IDB, cannot clear`);
        return false;
    }
    yield call([dbApi, dbApi.updateAttachment], idbAttachment, { dirty: false });
    return true;
}

// Local helper function since cleanSerializedAttachment isn't available
function cleanAttachmentSerialized(attachment: SerializedAttachment): SerializedAttachment {
    const { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error, encrypted, dirty, deleted } = attachment;
    return {
        id,
        ...(spaceId !== undefined && { spaceId }),
        ...(mimeType !== undefined && { mimeType }),
        uploadedAt,
        ...(rawBytes !== undefined && { rawBytes }),
        ...(processing && { processing: true }),
        ...(error && { error: true }),
        ...(encrypted ? { encrypted } : {}),
        ...(dirty && { dirty: true }),
        ...(deleted && { deleted: true }),
    };
}

export function* waitForAttachment(localId: LocalId): SagaIterator<Attachment> {
    const type = 'attachment';
    console.log(`Saga triggered: waitForAttachment: ${type} ${localId}`);
    const mapped: Attachment | undefined = yield select(selectAttachmentById(localId));
    if (mapped) {
        console.log(`waitForAttachment: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForAttachment: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addAttachment> = yield take(
        (a: any) => a.type === addAttachment.type && a.payload.id === localId
    );
    console.log(`waitForAttachment: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

export function* serializeAttachmentSaga(
    attachment: Attachment,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<SerializedAttachment> {
    const { id: localId, spaceId } = attachment;

    if (!spaceId) {
        throw new Error(`serializeAttachmentSaga ${localId}: attachment has no spaceId`);
    }

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `serializeAttachmentSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    // Restore binary data from cache for serialization
    const attachmentWithData: Attachment = {
        ...attachment,
        data: attachmentDataCache.getData(localId),
        imagePreview: attachmentDataCache.getImagePreview(localId),
    };

    const serializedAttachment: SerializedAttachment | undefined = yield call(
        serializeAttachment,
        attachmentWithData,
        spaceDek_
    );
    if (!serializedAttachment) {
        throw new Error(`serializeAttachmentSaga ${localId}: cannot serialize attachment ${localId}`);
    }
    return serializedAttachment;
}

export function* deserializeAttachmentSaga(
    serializedAttachment: SerializedAttachment,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<Attachment> {
    const { id: localId, spaceId } = serializedAttachment;

    if (!spaceId) {
        throw new Error(`deserializeAttachmentSaga ${localId}: attachment has no spaceId`);
    }

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `deserializeAttachmentSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    console.log(`deserializeAttachmentSaga ${localId}: calling deserializeAttachment for remote`);
    const deserializedRemoteAttachment: Attachment | null = yield call(
        deserializeAttachment,
        serializedAttachment,
        spaceDek_
    );
    console.log(
        `deserializeAttachmentSaga ${localId}: got deserialized remote attachment result`,
        deserializedRemoteAttachment
    );
    if (!deserializedRemoteAttachment) {
        throw new Error(`deserializeAttachmentSaga ${localId}: cannot deserialize attachment ${localId} from remote`);
    }

    // Store binary data in cache before cleaning
    // This ensures the cache is populated when loading from IndexedDB
    if (deserializedRemoteAttachment.data) {
        attachmentDataCache.setData(localId, deserializedRemoteAttachment.data);
    }
    if (deserializedRemoteAttachment.imagePreview) {
        attachmentDataCache.setImagePreview(localId, deserializedRemoteAttachment.imagePreview);
    }

    return cleanAttachment(deserializedRemoteAttachment);
}

export function* softDeleteAttachmentFromRemote({ payload: localId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteAttachmentFromRemote', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteAttachment(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteAttachment], localId, { dirty: false }); // IDB
    yield put(unindexAttachmentRequest({ id: localId })); // Index
}

export function* softDeleteAttachmentFromLocal({ payload: localId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteAttachmentFromLocal', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteAttachment(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteAttachment], localId, { dirty: true }); // IDB
    yield put(unindexAttachmentRequest({ id: localId })); // Index

    // Trigger push to sync deletion to server
    console.log(`softDeleteAttachmentFromLocal: triggering push for deleted attachment ${localId}`);
    yield put(pushAttachmentRequest({ id: localId, priority: 'urgent' }));
}

/*** loggers ***/

export function* logPushAttachmentSuccess({ payload }: { payload: PushAttachmentSuccess }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentSuccess', payload);
    console.log('push attachment success', payload);
}

export function* logPushAttachmentFailure({ payload }: { payload: PushAttachmentFailure }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentFailure', payload);
    console.error('push attachment failure', payload);
}

export function* logPushAttachmentNoop({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushAttachmentNoop', payload);
    console.log('push attachment noop', payload);
}

export function* logPullAttachmentFailure({ payload: attachmentId }: { payload: AttachmentId }): SagaIterator<any> {
    console.log('Saga triggered: logPullAttachmentFailure', attachmentId);
    console.error(`get attachment ${attachmentId} failure`);
}

/*** sync: local -> remote ***/

function* httpPostAttachment(serializedAttachment: SerializedAttachment, priority: Priority): SagaIterator<IdMapEntry> {
    console.log('Saga triggered: httpPostAttachment', serializedAttachment);
    const type: ResourceType = 'attachment';
    const { id: localId, spaceId: localSpaceId } = serializedAttachment;

    if (!localSpaceId) {
        throw new Error(`httpPostAttachment ${localId}: attachment has no spaceId`);
    }

    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    const attachmentToApi = convertNewAttachmentToApi(serializedAttachment, remoteSpaceId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postAttachment], attachmentToApi, priority);
    if (!remoteId) {
        throw new ClientError(`client error while posting ${type} ${localId}, not retrying`);
    }
    const entry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return entry;
}

function* httpDeleteAttachment(localId: LocalId, remoteId: RemoteId, priority: Priority): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpDeleteAttachment', { localId, remoteId });
    const type: ResourceType = 'attachment';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const status: RemoteStatus = yield call([lumoApi, lumoApi.deleteAttachment], remoteId, priority);
    if (status === 'deleted') {
        console.log(`DELETE ${type}: ${localId} was already deleted remotely, so the http delete was a noop`);
    }
    return status;
}

export function* pushAttachment({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: pushAttachment', payload);
    const type: ResourceType = 'attachment';
    const { id: localId } = payload;
    const priority = payload.priority || 'urgent';
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const remoteId: RemoteId | undefined = yield select(selectRemoteIdFromLocal(type, localId));
        const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);

        // Deletion case
        if (idbAttachment) {
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            const { deleted, dirty } = idbAttachment;
            if (deleted) {
                if (dirty) {
                    // DELETE
                    if (remoteId) {
                        const deleteArgs: [LocalId, RemoteId, Priority] = [localId, remoteId, priority];
                        yield call(callWithRetry, httpDeleteAttachment, deleteArgs);
                    }
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbAttachment);
                    // Delete from redux, and if it was done before, it's a noop
                    yield put(deleteAttachment(localId));
                    if (updated) {
                        yield put(pushAttachmentSuccess(payload));
                    } else {
                        yield put(pushAttachmentNeedsRetry(payload));
                    }
                    return;
                } else {
                    // deletion was already synced, noop
                    yield put(pushAttachmentNoop(payload));
                    return;
                }
            }
        }

        // Encrypt the attachment for IDB and the remote
        const attachment: Attachment | undefined = yield select(selectAttachmentById(localId)); // grab from redux
        if (!attachment) {
            // Attachment was deleted (e.g., auto-retrieved file cleaned up on folder unlink)
            console.log(`pushAttachment: attachment ${localId} not found in Redux, skipping`);
            yield put(pushAttachmentNoop(payload));
            return;
        }

        if (!attachment.spaceId) {
            console.log(
                `pushAttachment: attachment ${localId} is provisional (still in the composer area), so we don't push it.`
            );
            yield put(pushAttachmentNoop(payload));
            return;
        }

        const serializedAttachment: SerializedAttachment = yield call(serializeAttachmentSaga, attachment);

        // Check if attachment already exists remotely (e.g., if we already pushed it before)
        if (remoteId) {
            // Attachments are immutable, they can be only sent once (with POST) to the server and never modified.
            // Therefore we won't try to POST it again - this would lead to 409 Conflict.
            console.log(
                `pushAttachment: attachment ${localId} already has remote ID ${remoteId}, ` +
                    `so it exists remotely, not pushing`
            );
            // Still need to save to IndexedDB if not already there (e.g., after pullSpaces creates idmap)
            if (!idbAttachment) {
                console.log(`pushAttachment: saving attachment ${localId} on IDB since it is not present there`);
                yield call([dbApi, dbApi.updateAttachment], serializedAttachment, { dirty: false });
                yield put(pushAttachmentSuccess(payload));
            } else {
                yield put(pushAttachmentNoop(payload));
            }
            return;
        }

        // Save the attachment to IndexedDB with a dirty flag
        yield call(saveDirtyAttachment, serializedAttachment);

        // Always use POST for attachments (which are assets), never PUT
        const entry: IdMapEntry = yield call(callWithRetry, httpPostAttachment, [serializedAttachment, priority]);

        // Finish
        const updated: boolean = yield call(clearDirtyIfUnchanged, serializedAttachment);
        if (updated) {
            yield put(pushAttachmentSuccess({ ...payload, attachment, serializedAttachment, entry }));
        } else {
            yield put(pushAttachmentNeedsRetry(payload));
        }
    } catch (e) {
        // Retry unless it's a 4xx client error (in which case we expect retrying to fail again)
        console.error(e);
        if (isClientError(e)) {
            if (isConflictClientError(e)) {
                // 409: the asset already exists remotely, there is nothing left to sync
                yield call(clearDirtyUnconditionally, localId);
            }
            yield put(pushAttachmentFailure({ ...payload, error: `${e}` }));
            yield put(setAttachmentError({ id: localId, error: `${e}` }));
        } else {
            yield put(pushAttachmentNeedsRetry(payload));
        }
    }
}

export function* retryPushAttachment({ payload }: { payload: PushAttachmentRequest }): SagaIterator<any> {
    console.log('Saga triggered: retryPushAttachment', payload);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield call(pushAttachment, { payload: { ...payload, priority: 'background' } });
}

/*** sync: remote -> local ***/

export function* refreshShallowAttachmentFromRemote({
    payload: remoteAttachment,
}: {
    payload: RemoteShallowAttachmentRequest;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshShallowAttachmentFromRemote', remoteAttachment);
    const { id: localId, remoteId, spaceId, requestFull } = remoteAttachment;

    if (!spaceId) {
        console.warn(`refreshShallowAttachmentFromRemote: attachment ${localId} has no spaceId, skipping`);
        return;
    }

    // The attachment has no data, but we save the remote id, this will be used for pulling it from remote.
    const entry: IdMapEntry = { type: 'attachment', localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    // Then consider pulling it from remote. This will be a noop if it turns out we already have it.
    if (requestFull) {
        if (!spaceId) {
            console.log('refreshShallowAttachmentFromRemote: attachment has no space id, cannot pull full attachment');
            return;
        }
        const request: PullAttachmentRequest = { id: localId, spaceId };
        yield fork(considerRequestingFullAttachment, { payload: request });
    }
}

export function* refreshFilledAttachmentFromRemote({
    payload: remoteAttachment,
}: {
    payload: RemoteFilledAttachment;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshFilledAttachmentFromRemote', remoteAttachment);
    const type = 'attachment';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, spaceId: localSpaceId, remoteId } = remoteAttachment;

    if (!localSpaceId) {
        console.error(`refreshAttachmentFromRemote: attachment ${localId} has no spaceId`);
        return;
    }

    // Check if this is a shallow attachment (no encrypted data to deserialize)
    if (!remoteAttachment.encrypted) {
        console.log(`refreshAttachmentFromRemote: attachment ${localId} is shallow, checking if we need to pull`);

        // Check if attachment already exists in Redux with data (already loaded)
        const existingAttachment: Attachment | undefined = yield select(selectAttachmentById(localId));
        if (existingAttachment?.data) {
            console.log(`refreshAttachmentFromRemote: attachment ${localId} already has data, skipping pull`);
            return;
        }

        // Check if we're already loading this attachment
        const loadingState = yield select((s: LumoState) => s.attachmentLoadingState[localId]);
        if (loadingState?.loading) {
            console.log(
                `refreshAttachmentFromRemote: attachment ${localId} is already loading, skipping duplicate pull`
            );
            return;
        }

        // Add shallow attachment to Redux so components can find it
        const shallowAttachment = cleanAttachment(remoteAttachment as any);
        yield put(addAttachment(shallowAttachment));

        // Add ID mapping
        yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true }));

        // Trigger pull to fetch full attachment data from server (only once)
        console.log(`refreshAttachmentFromRemote: attachment ${localId} triggering pull for the first time`);
        yield put(pullAttachmentRequest({ id: localId, spaceId: localSpaceId }));
        return;
    }

    // Compare with object in Redux
    const localSpace: Space = yield call(waitForSpace, localSpaceId);
    const spaceDek: AesGcmCryptoKey = yield call(getSpaceDek, localSpace);
    const deserializedRemoteAttachment: Attachment | null = yield call(
        deserializeFilledAttachment,
        remoteAttachment,
        spaceDek
    );
    if (!deserializedRemoteAttachment) {
        console.error(`refreshAttachmentFromRemote: cannot deserialize attachment ${localId} from remote`);
        return;
    }
    const cleanRemote = cleanAttachment(deserializedRemoteAttachment);
    const localAttachment: Attachment | undefined = yield select(selectAttachmentById(localId));
    if (localAttachment) {
        const cleanLocal = cleanAttachment(localAttachment);
        if (isEqual(cleanRemote, cleanLocal)) {
            console.log('refreshAttachmentFromRemote: received attachment is the same as the one in Redux, noop');
            return;
        }
    }

    // Compare with object in IDB
    const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);
    if (idbAttachment) {
        if (idbAttachment.dirty) {
            console.log(
                `Received a remote refresh for attachment ${localId}, but it is marked dirty locally, not updating`
            );
            return;
        }
        const cleanSerializedRemote = cleanAttachmentSerialized(remoteAttachment);
        const cleanSerializedLocal = cleanAttachmentSerialized(idbAttachment);
        if (isEqual(cleanSerializedRemote, cleanSerializedLocal)) {
            console.log('refreshAttachmentFromRemote: received attachment is the same as the one in IDB, noop');
            return;
        }
    }

    // Update locally
    yield put(addAttachment(cleanRemote)); // Redux
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
    yield call([dbApi, dbApi.updateAttachment], remoteAttachment, { dirty: false }); // IDB
    yield put(indexAttachmentRequest(cleanRemote)); // Index
}

export function* pullAttachment({ payload }: { payload: PullAttachmentRequest }): SagaIterator<void> {
    const { id: localId, spaceId: localSpaceId } = payload;
    console.log('Saga triggered: pullAttachment', localId);
    const type = 'attachment';

    // Set loading state at the start
    yield put(setAttachmentLoading(localId));

    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        const remoteId: RemoteId | undefined = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
        if (!remoteId) {
            console.error(`pullAttachment: Remote ID not found for attachment ${localId}`);
            return;
        }
        const result: RemoteFilledAttachment | RemoteDeletedAttachment = yield call(
            [lumoApi, lumoApi.getAttachment],
            remoteId,
            localSpaceId
        );
        yield put(pullAttachmentSuccess(result));
    } catch (e) {
        console.error(`pullAttachment: Error pulling attachment ${localId}:`, e);
        yield put(pullAttachmentFailure(localId));
        yield put(setAttachmentError({ id: localId, error: 'Failed to download attachment' }));
    }
}

export function* processPullAttachmentResult({
    payload,
}: {
    payload: RemoteFilledAttachment | RemoteDeletedAttachment;
}): SagaIterator<any> {
    console.log('Saga triggered: processPullAttachmentResult', payload);
    console.log('get attachment success' /* , payload */);
    const { deleted, id } = payload;
    if (deleted) {
        yield put(locallyDeleteAttachmentFromRemoteRequest(id));
    } else {
        yield put(locallyRefreshFilledAttachmentFromRemoteRequest(payload));
    }
    yield put(clearAttachmentLoading(id));
}

export function* considerRequestingFullAttachment({
    payload: shallowAttachment,
}: {
    payload: PullAttachmentRequest;
}): SagaIterator<any> {
    console.log('Saga triggered: considerRequestingFullAttachment', shallowAttachment);
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, spaceId } = shallowAttachment;

    // Compare with object in IDB
    const idbAttachment: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], localId);
    if (idbAttachment && idbAttachment.encrypted) {
        console.log(
            `considerRequestingFullAttachment: Attachment ${localId} is already filled locally, not requesting`
        );

        // Load the attachment from IDB into Redux if it's not already there
        const existingInRedux: Attachment | undefined = yield select(selectAttachmentById(localId));
        if (!existingInRedux) {
            try {
                const space: Space | undefined = yield select(selectSpaceById(spaceId));
                if (!space) {
                    console.warn(
                        `considerRequestingFullAttachment: Cannot load attachment ${localId} - space ${spaceId} not found`
                    );
                    return;
                }
                const spaceDek: AesGcmCryptoKey = yield call(getSpaceDek, space);
                const attachment: Attachment = yield call(deserializeAttachmentSaga, idbAttachment, spaceDek);
                // Cache is populated inside deserializeAttachmentSaga
                yield put(addAttachment(attachment));
            } catch (e) {
                console.error(`considerRequestingFullAttachment: Failed to load attachment ${localId} from IDB:`, e);
            }
        }
        return;
    }
    console.log(`considerRequestingFullAttachment: Attachment ${localId} will be requested`);
    yield put(pullAttachmentRequest(shallowAttachment));
}

/**
 * Index a pulled attachment for search if it's a project file with content.
 * This ensures files added in other browsers are indexed for RAG.
 */
export function* indexAttachment({ payload }: { payload: IndexAttachmentRequest }): SagaIterator<void> {
    try {
        const { attachment } = payload;

        if (!attachment || !attachment.markdown || attachment.driveNodeId) {
            return;
        }
        const { id } = attachment;

        const userId: string | undefined = yield select((state: LumoState) => state.user?.value?.ID);
        if (!userId) {
            return;
        }

        const { SearchService } = yield call(() => import('../../services/search/searchService')); // todo clean import
        const searchService = SearchService.get(userId);

        // Index the attachment
        const result: { success: boolean; indexed: number } = yield call(
            [searchService, searchService.reindexUploadedAttachments],
            [attachment]
        );

        console.log(`[indexPulledAttachment] Indexed attachment ${id}:`, result);
    } catch (error) {
        console.warn('[indexPulledAttachment] Failed to index pulled attachment:', error);
    }
}

export function* unindexAttachment({ payload }: { payload: UnindexAttachmentRequest }): SagaIterator<any> {
    const { id: localId } = payload;
    console.log('Saga triggered: unindexAttachment', localId);
    const userId: string | undefined = yield select((state: LumoState) => state.user?.value?.ID);
    if (!userId) return;
    try {
        // todo consider a pattern like this instead:
        //    const dbApi: DbApi = yield getContext('dbApi');
        const SearchService = yield call(() =>
            import('../../services/search/searchService').then((m) => m.SearchService)
        );
        const searchService = SearchService.get(userId);
        searchService.removeDocument(localId);
        console.log('[Attachment] Removed from search index:', localId);
    } catch (error) {
        console.error('[Attachment] Failed to remove from search index:', error);
    }
}
