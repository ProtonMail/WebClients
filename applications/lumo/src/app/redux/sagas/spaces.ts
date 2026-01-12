import type { SagaIterator } from 'redux-saga';
import { call, delay, getContext, put, select, take } from 'redux-saga/effects';

import { base64ToMasterKey } from '../../crypto';
import type { AesKwCryptoKey } from '../../crypto/types';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi, RemoteStatus } from '../../remote/api';
import { convertNewSpaceToApi, convertSpaceToApi } from '../../remote/conversion';
import type { Priority } from '../../remote/scheduler';
import type { IdMapEntry, ListSpacesRemote, LocalId, RemoteId, RemoteSpace, ResourceType } from '../../remote/types';
import { deserializeSpace, serializeSpace } from '../../serialization';
import { SearchService } from '../../services/search/searchService';
import {
    type Attachment,
    type SerializedSpace,
    type Space,
    type SpaceId,
    cleanSerializedSpace,
    cleanSpace,
    getProjectInfo,
} from '../../types';
import { listify, mapIds, setIds } from '../../util/collections';
import { isoToUnixTimestamp } from '../../util/date';
import {
    selectAttachmentsBySpaceId,
    selectConversationsBySpaceId,
    selectMasterKey,
    selectMessagesBySpaceId,
    selectRemoteIdFromLocal,
    selectSpaceById,
} from '../selectors';
import {
    type AttachmentMap,
    deleteAllAttachments,
    deleteAttachment,
    locallyDeleteAttachmentFromRemoteRequest,
    pullAttachmentRequest,
    upsertAttachment,
} from '../slices/core/attachments';
import type { ConversationMap } from '../slices/core/conversations';
import {
    deleteAllConversations,
    deleteConversation,
    locallyDeleteConversationFromRemoteRequest,
    locallyRefreshConversationFromRemoteRequest,
} from '../slices/core/conversations';
import { addIdMapEntry, deleteAllIdMaps } from '../slices/core/idmap';
import { type MessageMap, deleteAllMessages, deleteMessage } from '../slices/core/messages';
import {
    type PushSpaceRequest,
    type PushSpaceSuccess,
    addSpace,
    deleteAllSpaces,
    deleteAllSpacesFailure,
    deleteAllSpacesSuccess,
    deleteSpace,
    locallyDeleteSpaceFromRemoteRequest,
    locallyRefreshSpaceFromRemoteRequest,
    pullSpacesFailure,
    pullSpacesPageResponse,
    pullSpacesSuccess,
    pushSpaceFailure,
    pushSpaceNeedsRetry,
    pushSpaceNoop,
    pushSpaceSuccess,
} from '../slices/core/spaces';
import type { LumoState } from '../store';
import { RETRY_PUSH_EVERY_MS, callWithRetry, isClientError } from './index';

// Type alias for backwards compatibility
type Asset = Attachment;

/*** helpers ***/
export function* saveDirtySpace(serializedSpace: SerializedSpace): SagaIterator {
    console.log('Saga triggered: saveDirtySpace', serializedSpace);

    // Check if this space is associated with ghost conversations - if so, skip saving to IndexedDB
    const conversations: ConversationMap = yield select(selectConversationsBySpaceId(serializedSpace.id));
    const isGhostSpace = Object.values(conversations).some((conversation) => conversation.ghost);
    if (isGhostSpace) {
        console.log('saveDirtySpace: Space contains ghost conversations, skipping IndexedDB persistence');
        return;
    }

    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.updateSpace], serializedSpace, {
        dirty: true,
    });
}

export function* clearDirtyIfUnchanged(serializedSpace: SerializedSpace): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirtyIfUnchanged', serializedSpace);
    const dbApi: DbApi = yield getContext('dbApi');
    return yield call([dbApi, dbApi.markSpaceAsSynced], serializedSpace);
}

export function* deleteSpaceCascadeInRedux(spaceId: SpaceId): SagaIterator<any> {
    const conversations: ConversationMap = yield select(selectConversationsBySpaceId(spaceId));
    const messages: MessageMap = yield select(selectMessagesBySpaceId(spaceId));
    const attachments: AttachmentMap = yield select(selectAttachmentsBySpaceId(spaceId));
    for (const conversationId of mapIds(conversations)) {
        yield put(deleteConversation(conversationId));
    }
    for (const messageId of mapIds(messages)) {
        yield put(deleteMessage(messageId));
    }
    for (const attachmentId of mapIds(attachments)) {
        yield put(deleteAttachment(attachmentId));
    }
    yield put(deleteSpace(spaceId));
}

export function* softDeleteSpaceFromRemote({ payload: localId }: { payload: SpaceId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteSpaceFromRemote', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call(deleteSpaceCascadeInRedux, localId); // Redux
    yield call([dbApi, dbApi.softDeleteSpaceCascade], localId, { dirty: false }); // IDB
}

export function* softDeleteSpaceFromLocal({ payload: localId }: { payload: SpaceId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteSpaceFromLocal', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call(deleteSpaceCascadeInRedux, localId); // Redux
    yield call([dbApi, dbApi.softDeleteSpaceCascade], localId, { dirty: true }); // IDB
}

export function* serializeSpaceSaga(space: Space): SagaIterator<SerializedSpace> {
    const { id: localId } = space;
    const masterKeyBase64 = yield select(selectMasterKey);
    if (!masterKeyBase64) {
        throw new Error(`serializeRemoteSpace ${localId}: no master key in state`);
    }
    const masterKey: AesKwCryptoKey = yield call(base64ToMasterKey, masterKeyBase64);
    const serializedSpace: SerializedSpace | undefined = yield call(serializeSpace, space, masterKey);
    if (!serializedSpace) {
        throw new Error(`serializeRemoteSpace ${localId}: cannot serialize space ${localId} from remote`);
    }
    return cleanSerializedSpace(serializedSpace);
}

export function* deserializeSpaceSaga(serializedSpace: SerializedSpace): SagaIterator<Space> {
    const { id: localId } = serializedSpace;

    const masterKeyBase64 = yield select(selectMasterKey);
    if (!masterKeyBase64) {
        throw new Error(`deserializeRemoteSpace ${localId}: no master key in state`);
    }
    const masterKey: AesKwCryptoKey = yield call(base64ToMasterKey, masterKeyBase64);
    const deserializedSpace: Space | null = yield call(deserializeSpace, serializedSpace, masterKey);
    if (!deserializedSpace) {
        throw new Error(`deserializeRemoteSpace ${localId}: cannot deserialize space ${localId} from remote`);
    }
    return cleanSpace(deserializedSpace);
}

export function* waitForSpace(localId: LocalId): SagaIterator<Space> {
    const type = 'space';
    console.log(`Saga triggered: waitForSpace: ${type} ${localId}`);
    const mapped: Space | undefined = yield select(selectSpaceById(localId));
    if (mapped) {
        console.log(`waitForSpace: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForSpace: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addSpace> = yield take(
        (a: any) => a.type === addSpace.type && a.payload.id === localId
    );
    console.log(`waitForSpace: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

/*** loggers ***/

export function* logPushSpaceSuccess({ payload }: { payload: PushSpaceSuccess }): SagaIterator<any> {
    console.log('Saga triggered: logPushSpaceSuccess', payload);
    console.log('push space success', payload);
}

export function* logPushSpaceFailure({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushSpaceFailure', payload);
    console.error('push space failure', payload);
}

export function* logPushSpaceNoop({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushSpaceNoop', payload);
    console.log('push space noop', payload);
}

export function* logPullSpacesFailure({}: { payload: void }): SagaIterator<any> {
    console.log('Saga triggered: logPullSpacesFailure');
    console.error('list space failure');
}

export function* logPullSpacesSuccess({}: { payload: void }): SagaIterator<any> {
    console.log('Saga triggered: logPullSpacesSuccess');
    console.log('list space success');
}

export function* logDeleteAllSpacesSuccess({}: { payload: void }): SagaIterator<any> {
    console.log('Saga triggered: logDeleteAllSpacesSuccess');
    console.log('delete all spaces success');
}

export function* logDeleteAllSpacesFailure({ payload }: { payload: { error: string } }): SagaIterator<any> {
    console.log('Saga triggered: logDeleteAllSpacesFailure', payload);
    console.error('delete all spaces failure', payload);
}

/*** operations ***/

export function* handleDeleteAllSpaces(): SagaIterator<any> {
    console.log('Saga triggered: handleDeleteAllSpaces');
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const lumoApi: LumoApi = yield getContext('lumoApi');

        const status: RemoteStatus = yield call([lumoApi, lumoApi.callDeleteAllSpaces]);

        if (status === 'deleted') {
            console.log('API delete all spaces successful, soft deleting local data');
        }

        console.log('API delete all spaces successful, soft deleting local data');

        // Soft delete all data in IndexedDB (set deleted: true flags)
        // Use dirty: false since we already synced with the server
        yield call([dbApi, dbApi.softDeleteAllData], { dirty: false });

        // Clear the search index for all documents (uploaded files + Drive files)
        const userId: string | undefined = yield select((state: LumoState) => state.user?.value?.ID);
        if (userId) {
            const searchService = SearchService.get(userId);
            yield call([searchService, searchService.clearDriveDocuments]);
        }

        // Clear all Redux state (since Redux doesn't load deleted items)
        yield put(deleteAllSpaces());
        yield put(deleteAllConversations());
        yield put(deleteAllMessages());
        yield put(deleteAllAttachments());
        yield put(deleteAllIdMaps());

        console.log('Local data cleared successfully');
        yield put(deleteAllSpacesSuccess());
    } catch (e) {
        console.error('Error in handleDeleteAllSpaces:', e);
        yield put(deleteAllSpacesFailure({ error: `${e}` }));
        // todo: consider if we must distinguish client vs server error:
        // if (isClientError(e)) { ... } else { ... }
    }
}

/*** sync: local -> remote ***/

export function* httpPostSpace(serializedSpace: SerializedSpace, priority: Priority): SagaIterator<IdMapEntry> {
    console.log('Saga triggered: httpPostSpace', serializedSpace);
    const type: ResourceType = 'space';
    const { id: localId } = serializedSpace;
    const spaceToApi = convertNewSpaceToApi(serializedSpace);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postSpace], spaceToApi, priority);
    const entry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return entry;
}

export function* httpPutSpace(
    serializedSpace: SerializedSpace,
    remoteId: RemoteId,
    priority: Priority
): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpPutSpace', {
        localId: serializedSpace.id,
        remoteId,
        hasEncrypted: !!serializedSpace.encrypted,
    });
    const lumoApi: LumoApi = yield getContext('lumoApi');
    // convertSpaceToApi uses local id, but PUT needs remote id
    const baseSpaceToApi = convertSpaceToApi(serializedSpace);
    const spaceToApi = { ...baseSpaceToApi, ID: remoteId };
    console.log('httpPutSpace: Sending PUT request for space', { localId: serializedSpace.id, remoteId });
    const status: RemoteStatus = yield call([lumoApi, lumoApi.putSpace], spaceToApi, priority);
    console.log('httpPutSpace: PUT response status:', status);
    return status;
}

export function* httpDeleteSpace(localId: LocalId, remoteId: RemoteId, priority: Priority): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpDeleteSpace', { localId, remoteId });
    const type: ResourceType = 'space';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const status: RemoteStatus = yield call([lumoApi, lumoApi.deleteSpace], remoteId, priority);
    if (status === 'deleted') {
        console.log(`DELETE ${type}: ${localId} was already deleted remotely, so the http delete was a noop`);
    }
    return status;
}

export function* pushSpace({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.log('Saga triggered: pushSpace', payload);
    const type: ResourceType = 'space';
    const { id: localId } = payload;
    const priority = payload.priority || 'urgent';

    // Check if phantom chat mode is enabled - if so, skip remote persistence
    const isGhostChatMode: boolean = yield select((state: LumoState) => state.ghostChat?.isGhostChatMode || false);
    if (isGhostChatMode) {
        console.log('pushSpace: Phantom chat mode is enabled, skipping remote persistence');
        yield put(pushSpaceSuccess(payload));
        return;
    }

    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const idbSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], localId);

        // Deletion case
        if (idbSpace) {
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            const { deleted, dirty } = idbSpace;
            if (deleted) {
                if (dirty) {
                    // DELETE
                    const remoteId = yield select(selectRemoteIdFromLocal(type, localId));
                    if (remoteId) {
                        yield call(callWithRetry, httpDeleteSpace, [localId, remoteId, priority]);
                    }
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbSpace);
                    // Delete from redux, and if it was done before, it's a noop
                    yield call(deleteSpaceCascadeInRedux, localId);
                    if (updated) {
                        yield put(pushSpaceSuccess(payload));
                    } else {
                        yield put(pushSpaceNeedsRetry(payload));
                    }
                    return;
                } else {
                    // deletion was already synced, noop
                    yield put(pushSpaceNoop(payload));
                    return;
                }
            }
        }

        // Encrypt the conversation for IDB and the remote
        const space: Space | undefined = yield select(selectSpaceById(localId));
        if (!space) throw new Error(`cannot find ${type} ${localId} in Redux`);
        const serializedSpace: SerializedSpace = yield call(serializeSpaceSaga, space);

        // Check if space already exists remotely
        const remoteId = yield select(selectRemoteIdFromLocal(type, localId));
        if (remoteId) {
            // Space was already posted - update it remotely with PUT
            // This ensures linkedDriveFolder and other changes sync across browsers
            yield call(saveDirtySpace, serializedSpace);

            // PUT to update remote
            yield call(callWithRetry, httpPutSpace, [serializedSpace, remoteId, priority]);

            // Clear dirty flag
            const updated: boolean = yield call(clearDirtyIfUnchanged, serializedSpace);
            if (updated) {
                yield put(pushSpaceSuccess(payload));
            } else {
                yield put(pushSpaceNeedsRetry(payload));
            }
            return;
        }

        // Save the space to IndexedDB with a dirty flag
        yield call(saveDirtySpace, serializedSpace);

        // POST
        const entry = yield call(callWithRetry, httpPostSpace, [serializedSpace, priority]);

        // Finish
        const updated: boolean = yield call(clearDirtyIfUnchanged, serializedSpace);
        if (updated) {
            yield put(pushSpaceSuccess({ ...payload, entry }));
        } else {
            yield put(pushSpaceNeedsRetry(payload));
        }
    } catch (e) {
        // Retry unless it's a 4xx client error (in which case we expect retrying to fail again)
        console.error(e);
        if (isClientError(e)) {
            yield put(pushSpaceFailure({ ...payload, error: `${e}` }));
        } else {
            yield put(pushSpaceNeedsRetry(payload));
        }
    }
}

export function* retryPushSpace({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.log('Saga triggered: retryPushSpace', payload);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield call(pushSpace, { payload: { ...payload, priority: 'background' } });
}

/*** sync: remote -> local ***/

export function* pullSpaces(): SagaIterator<void> {
    console.log('Saga triggered: pullSpaces');
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        let lastTimestamp: number | undefined;

        while (true) {
            const pageResult: ListSpacesRemote = yield call(
                [lumoApi, lumoApi.listSpaces],
                lastTimestamp ? { createTimeUntil: lastTimestamp } : undefined
            );
            yield put(pullSpacesPageResponse(pageResult));

            const allSpaces = [...listify(pageResult.spaces), ...listify(pageResult.deletedSpaces)];
            if (allSpaces.length === 0) break;

            const newLastTimestamp = allSpaces
                .map((s) => s.createdAt)
                .map((iso: string): number => isoToUnixTimestamp(iso))
                .reduce((oldest, current) => {
                    if (!oldest) return current;
                    return current <= oldest ? current : oldest;
                }, lastTimestamp);

            if (!newLastTimestamp || (lastTimestamp && newLastTimestamp >= lastTimestamp)) break;

            lastTimestamp = newLastTimestamp;
            yield delay(1000);
        }

        yield put(pullSpacesSuccess());
    } catch (e) {
        console.error('Error pulling spaces:', e);
        yield put(pullSpacesFailure());
    }
}

export function* processPullSpacesPage({ payload }: { payload: ListSpacesRemote }): SagaIterator<any> {
    console.log('Saga triggered: processListSpaces', payload);
    console.log('list space success' /* , payload */);
    const { conversations, deletedConversations, deletedSpaces, spaces, assets, deletedAssets } = payload;
    for (const space of listify(deletedSpaces)) {
        const { wrappedSpaceKey, ...deletedSpace } = space;
        yield put(locallyDeleteSpaceFromRemoteRequest(deletedSpace.id));
    }
    for (const space of listify(spaces)) {
        yield put(locallyRefreshSpaceFromRemoteRequest(space));
    }
    for (const conversation of listify(deletedConversations)) {
        yield put(locallyDeleteConversationFromRemoteRequest(conversation.id));
    }
    for (const conversation of listify(conversations)) {
        yield put(locallyRefreshConversationFromRemoteRequest(conversation));
    }

    // Process deleted assets FIRST to ensure they're removed before processing active assets
    const deletedAssetIds = setIds(deletedAssets);
    for (const asset of listify(deletedAssets)) {
        if (!asset.spaceId) {
            console.warn(`Deleted asset ${asset.id} has no spaceId, skipping`);
            continue;
        }
        yield put(locallyDeleteAttachmentFromRemoteRequest(asset.id));
    }

    // Process active assets, but skip any that are in the deletedAssets list
    const validAssetIds = new Set<string>();
    for (const asset of listify(assets)) {
        if (!asset.spaceId) {
            console.warn(`Asset ${asset.id} has no spaceId, skipping`);
            continue;
        }
        // Skip assets that are marked as deleted
        if (deletedAssetIds.has(asset.id)) {
            console.log(`Skipping asset ${asset.id} - it's in the deletedAssets list`);
            continue;
        }
        validAssetIds.add(asset.id);

        // Add a shallow/placeholder attachment to Redux first so pullAttachment can work
        // The /spaces response has Encrypted: null, so we only have metadata at this point
        const shallowAttachment: Attachment = {
            id: asset.id,
            spaceId: asset.spaceId,
            uploadedAt: asset.uploadedAt,
            mimeType: asset.mimeType,
            rawBytes: asset.rawBytes,
            filename: '', // Will be populated when full attachment is pulled
        };
        yield put(upsertAttachment(shallowAttachment));

        // Add idmap entry for the asset (local -> remote mapping)
        yield put(addIdMapEntry({ type: 'attachment', localId: asset.id, remoteId: asset.remoteId, saveToIdb: true }));
        // Assets in /spaces response have Encrypted: null, need to fetch individually via /assets/:id
        yield put(pullAttachmentRequest({ id: asset.id }));
    }

    // Clean up: Remove any assets from Redux that belong to synced spaces but aren't in the valid remote assets list
    const syncedSpaceIds = new Set([...listify(spaces).map((s) => s.id), ...listify(deletedSpaces).map((s) => s.id)]);
    for (const spaceId of syncedSpaceIds) {
        const localAssets: Record<string, Asset> = yield select(selectAttachmentsBySpaceId(spaceId));
        for (const asset of Object.values(localAssets)) {
            // If asset is not in valid remote assets list and not in deleted assets list, remove it from Redux
            if (!validAssetIds.has(asset.id) && !deletedAssetIds.has(asset.id)) {
                console.log(`Removing asset ${asset.id} from Redux - not in remote assets list`);
                yield put(deleteAttachment(asset.id));
            }
        }
    }
}

export function* refreshSpaceFromRemote({
    payload: encryptedRemoteSpace,
}: {
    payload: RemoteSpace;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshSpaceFromRemote', encryptedRemoteSpace);
    const type = 'space';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, remoteId } = encryptedRemoteSpace;

    // Deserialize before inserting into Redux
    console.log(`refreshSpaceFromRemote ${localId}: selecting masterkey`);
    const masterKeyBase64 = yield select(selectMasterKey);
    if (!masterKeyBase64) {
        throw new Error(`in refreshSpaceFromRemote ${localId}: no master key in state`);
    }
    console.log(`refreshSpaceFromRemote ${localId}: got masterkey`);
    const masterKey: AesKwCryptoKey = yield call(base64ToMasterKey, masterKeyBase64);
    console.log(`refreshSpaceFromRemote ${localId}: got masterkey decoded`);
    console.log(`refreshSpaceFromRemote ${localId}: calling deserializeSpace for remote`);
    const deserializedRemoteSpace: Space | null | undefined = yield call(
        deserializeSpace,
        encryptedRemoteSpace,
        masterKey
    );
    console.log(`refreshSpaceFromRemote ${localId}: got deserialized remote space result`, deserializedRemoteSpace);
    if (!deserializedRemoteSpace) {
        console.error(`refreshSpaceFromRemote ${localId}: cannot deserialize space ${localId} from remote`);
        return;
    }
    const remoteSpace = cleanSpace(deserializedRemoteSpace);
    const { isLinked: remoteIsLinkedToDrive } = getProjectInfo(remoteSpace);
    console.log(`refreshSpaceFromRemote ${localId}: remote space is linked to drive:`, remoteIsLinkedToDrive);

    // Check if space already exists locally
    const localSpace: Space | undefined = yield select(selectSpaceById(localId));
    const encryptedIdbSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], localId);

    if (localSpace) {
        // Space exists in Redux - check if linkedDriveFolder state differs between local and remote
        const { isLinked: localIsLinkedToDrive, linkedDriveFolder: localLinkedFolder } = getProjectInfo(localSpace);
        const { linkedDriveFolder: remoteLinkedFolder } = getProjectInfo(remoteSpace);

        console.log(`refreshSpaceFromRemote ${localId}: Comparing drive state:`, {
            localIsLinked: localIsLinkedToDrive,
            localFolderId: localLinkedFolder?.folderId,
            remoteIsLinked: remoteIsLinkedToDrive,
            remoteFolderId: remoteLinkedFolder?.folderId,
        });

        if (remoteIsLinkedToDrive !== localIsLinkedToDrive) {
            // linkedDriveFolder state differs
            if (remoteIsLinkedToDrive && !localIsLinkedToDrive) {
                // Remote has link, local doesn't - update local from remote
                console.log(`refreshSpaceFromRemote ${localId}: Remote is linked to drive, updating local`);
                yield put(addSpace(remoteSpace)); // Update Redux with remote data
                yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false }); // Update IDB
            } else if (!remoteIsLinkedToDrive && localIsLinkedToDrive) {
                // Local has link, remote doesn't - KEEP LOCAL (sync hasn't propagated yet)
                // Don't overwrite local with remote to prevent data loss
                console.log(`refreshSpaceFromRemote ${localId}: Local is linked to drive but remote is not - KEEPING LOCAL (pending sync)`);
                // The pushSpaceRequest should sync the local linkedDriveFolder to remote
            }
        } else {
            console.log(`refreshSpaceFromRemote ${localId}: Both have same link state (${localIsLinkedToDrive}), noop`);
        }
        return;
    }

    if (encryptedIdbSpace) {
        // Space exists in IDB but not Redux - deserialize from IDB and check if remote differs
        console.log(`refreshSpaceFromRemote ${localId}: idb object exists, checking for updates`);
        const idbSpace: Space | null | undefined = yield call(deserializeSpace, encryptedIdbSpace, masterKey);
        const idbProjectInfo = idbSpace ? getProjectInfo(idbSpace) : null;
        const idbIsLinkedToDrive = idbProjectInfo?.isLinked ?? false;

        // If linkedDriveFolder state differs between remote and IDB
        if (remoteIsLinkedToDrive !== idbIsLinkedToDrive) {
            if (remoteIsLinkedToDrive && !idbIsLinkedToDrive) {
                // Remote has link, IDB doesn't - update from remote
                console.log(`refreshSpaceFromRemote ${localId}: Remote is linked to drive, updating from remote`);
                yield put(addSpace(remoteSpace)); // Redux
                yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
                yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false }); // IDB
            } else if (!remoteIsLinkedToDrive && idbIsLinkedToDrive && idbSpace) {
                // IDB has link, remote doesn't - KEEP IDB (sync hasn't propagated yet)
                console.log(`refreshSpaceFromRemote ${localId}: IDB is linked to drive but remote is not - keeping IDB (pending sync)`);
                const cleanIdb = cleanSpace(idbSpace);
                yield put(addSpace(cleanIdb)); // Redux
                yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: false })); // Redux
            }
        } else if (idbSpace) {
            // Use IDB version
            const cleanIdb = cleanSpace(idbSpace);
            console.log(`refreshSpaceFromRemote ${localId}: Using IDB version`);
            yield put(addSpace(cleanIdb)); // Redux
            yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: false })); // Redux (don't re-save to IDB)
        }
        return;
    }

    // New space - insert from remote
    console.log(`refreshSpaceFromRemote ${localId}: updating locally: put(addSpace)`);
    yield put(addSpace(remoteSpace)); // Redux
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
    console.log(`refreshSpaceFromRemote ${localId}: updating locally: call(dbApi.updateSpace)`);
    yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false }); // IDB
}
