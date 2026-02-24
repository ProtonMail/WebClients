import type {SagaIterator} from 'redux-saga';
import {call, delay, getContext, put, select, take} from 'redux-saga/effects';

import {base64ToMasterKey} from '../../crypto';
import type {AesKwCryptoKey} from '../../crypto/types';
import type {DbApi} from '../../indexedDb/db';
import type {LumoApi, RemoteStatus} from '../../remote/api';
import {convertNewSpaceToApi, convertSpaceToApi} from '../../remote/conversion';
import type {Priority} from '../../remote/scheduler';
import type {
    GetSpaceRemote,
    IdMapEntry,
    ListSpacesRemote,
    LocalId,
    PullSpacesRemote,
    RemoteDeletedSpace,
    RemoteId,
    RemoteSpace,
    ResourceType,
} from '../../remote/types';
import {deserializeSpace, serializeSpace} from '../../serialization';
import {SearchService} from '../../services/search/searchService';
import {cleanSerializedSpace, cleanSpace, type SerializedSpace, type Space, type SpaceId} from '../../types';
import {listify, mapIds, mapify} from '../../util/collections';
import {isoToUnixTimestamp} from '../../util/date';
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
    locallyRefreshShallowAttachmentFromRemoteRequest,
} from '../slices/core/attachments';
import {
    type ConversationMap,
    deleteAllConversations,
    deleteConversation,
    locallyDeleteConversationFromRemoteRequest,
    locallyRefreshConversationFromRemoteRequest,
} from '../slices/core/conversations';
import {addIdMapEntry, deleteAllIdMaps} from '../slices/core/idmap';
import {deleteAllMessages, deleteMessage, type MessageMap} from '../slices/core/messages';
import {
    addSpace,
    deleteAllSpaces,
    deleteAllSpacesFailure,
    deleteAllSpacesSuccess,
    deleteSpace,
    locallyDeleteSpaceFromRemoteRequest,
    locallyRefreshSpaceFromRemoteRequest,
    pullSpaceFailure,
    type PullSpaceRequest,
    pullSpacesFailure,
    pullSpacesPageResponse,
    pullSpacesRequest,
    pullSpacesSuccess,
    pullSpaceSuccess,
    pushSpaceFailure,
    pushSpaceNeedsRetry,
    pushSpaceNoop,
    type PushSpaceRequest,
    pushSpaceRequest,
    type PushSpaceSuccess,
    pushSpaceSuccess,
} from '../slices/core/spaces';
import type {LumoState} from '../store';
import {callWithRetry, isClientError, RETRY_PUSH_EVERY_MS} from './index';

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
    yield call(deleteSpaceCascadeInRedux, localId);
    yield call([dbApi, dbApi.softDeleteSpaceCascade], localId, { dirty: false });
}

export function* softDeleteSpaceFromLocal({ payload: localId }: { payload: SpaceId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteSpaceFromLocal', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield call(deleteSpaceCascadeInRedux, localId);
    yield call([dbApi, dbApi.softDeleteSpaceCascade], localId, { dirty: true });
    yield put(pushSpaceRequest({ id: localId, priority: 'urgent' }));
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
    console.log('push space success', payload);
}

export function* logPushSpaceFailure({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.error('push space failure', payload);
}

export function* logPushSpaceNoop({ payload }: { payload: PushSpaceRequest }): SagaIterator<any> {
    console.log('push space noop', payload);
}

export function* logPullSpaceSuccess({ payload }: { payload: PullSpaceRequest }): SagaIterator<any> {
    console.log('pull space success', payload);
}

export function* logPullSpaceFailure({ payload }: { payload: SpaceId }): SagaIterator<any> {
    console.error('pull space failure', payload);
}

export function* logPullSpacesFailure({}: { payload: void }): SagaIterator<any> {
    console.error('list spaces failure');
}

export function* logPullSpacesSuccess({}: { payload: void }): SagaIterator<any> {
    console.log('list spaces success');
}

export function* logDeleteAllSpacesSuccess({}: { payload: void }): SagaIterator<any> {
    console.log('delete all spaces success');
}

export function* logDeleteAllSpacesFailure({ payload }: { payload: { error: string } }): SagaIterator<any> {
    console.error('delete all spaces failure', payload);
}

/*** operations ***/

export function* handleDeleteAllSpaces(): SagaIterator<any> {
    console.log('Saga triggered: handleDeleteAllSpaces');
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const lumoApi: LumoApi = yield getContext('lumoApi');

        yield call([lumoApi, lumoApi.callDeleteAllSpaces]);
        console.log('API delete all spaces successful, soft deleting local data');
        yield call([dbApi, dbApi.softDeleteAllData], { dirty: false });

        const userId: string | undefined = yield select((state: LumoState) => state.user?.value?.ID);
        if (userId) {
            const searchService = SearchService.get(userId);
            yield call([searchService, searchService.clearDriveDocuments]);
        }

        yield put(deleteAllSpaces());
        yield put(deleteAllConversations());
        yield put(deleteAllMessages());
        yield put(deleteAllAttachments());
        yield put(deleteAllIdMaps());

        yield put(deleteAllSpacesSuccess());
    } catch (e) {
        console.error('Error in handleDeleteAllSpaces:', e);
        yield put(deleteAllSpacesFailure({ error: `${e}` }));
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
    console.log('httpPutSpace', { localId: serializedSpace.id, remoteId });
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const baseSpaceToApi = convertSpaceToApi(serializedSpace);
    const spaceToApi = { ...baseSpaceToApi, ID: remoteId };
    return yield call([lumoApi, lumoApi.putSpace], spaceToApi, priority);
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

    const isGhostChatMode: boolean = yield select((state: LumoState) => state.ghostChat?.isGhostChatMode || false);
    if (isGhostChatMode) {
        yield put(pushSpaceSuccess(payload));
        return;
    }

    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const idbSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], localId);
        const remoteId = yield select(selectRemoteIdFromLocal(type, localId));

        // Deletion case
        if (idbSpace) {
            const { deleted, dirty } = idbSpace;
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            if (deleted) {
                if (dirty) {
                    if (remoteId) {
                        const deleteArgs: [LocalId, RemoteId, Priority] = [localId, remoteId, priority];
                        yield call(callWithRetry, httpDeleteSpace, deleteArgs);
                    }
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbSpace);
                    // Delete from redux, and if it was done before, it's a noop
                    yield call(deleteSpaceCascadeInRedux, localId);
                    yield put(updated ? pushSpaceSuccess(payload) : pushSpaceNeedsRetry(payload));
                } else {
                    // deletion was already synced, noop
                    yield put(pushSpaceNoop(payload));
                }
                return;
            }
        }

        const space: Space | undefined = yield select(selectSpaceById(localId));
        if (!space) throw new Error(`cannot find ${type} ${localId} in Redux`);
        const serializedSpace: SerializedSpace = yield call(serializeSpaceSaga, space);

        if (remoteId) {
            yield call(saveDirtySpace, serializedSpace);
            yield call(callWithRetry, httpPutSpace, [serializedSpace, remoteId, priority]);
            const updated: boolean = yield call(clearDirtyIfUnchanged, serializedSpace);
            yield put(updated ? pushSpaceSuccess(payload) : pushSpaceNeedsRetry(payload));
            return;
        }

        yield call(saveDirtySpace, serializedSpace);
        const entry = yield call(callWithRetry, httpPostSpace, [serializedSpace, priority]);
        const updated: boolean = yield call(clearDirtyIfUnchanged, serializedSpace);
        yield put(updated ? pushSpaceSuccess({ ...payload, entry }) : pushSpaceNeedsRetry(payload));
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

export function* waitForSpaceRemoteId(localId: SpaceId): SagaIterator<SpaceId | undefined> {
    console.log('Saga triggered: waitForSpaceRemoteId', localId);
    const type = 'space';
    const existingRemoteId: RemoteId | undefined = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
    if (existingRemoteId) {
        return existingRemoteId;
    }

    // Check if that space is local-only; if it was never pushed, it's useless to query the server
    const localSpace: Space | undefined = yield select(selectSpaceById(localId));
    if (localSpace) {
        console.log('waitForSpaceRemoteId: space was created on this device and is not yet pushed to the server');
        return undefined;
    }

    // Trigger a general listing of spaces, which contains local-remote id mapping for each space
    yield put(pullSpacesRequest());

    // Wait until the pullSpacesRequest is done...
    const result: ReturnType<typeof pullSpacesSuccess | typeof pullSpacesFailure> = yield take([
        pullSpacesSuccess.type,
        pullSpacesFailure.type,
    ]);

    // Nothing we can do if pullSpacesRequest failed
    if (result.type === pullSpacesFailure.type) {
        console.error(`waitForSpaceRemoteId: Failed to pull spaces list for ${localId}`);
        yield put(pullSpaceFailure(localId));
        return undefined;
    }

    // PullSpaces was successful; check if we have the mapping now
    const remoteId: RemoteId | undefined = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
    if (!remoteId) {
        console.error(`waitForSpaceRemoteId: Remote ID not found for ${localId} even after pulling spaces`);
        yield put(pullSpaceFailure(localId));
        return undefined;
    }

    // We now have the mapping! return it
    return remoteId;
}

export function* pullSpace({ payload }: { payload: PullSpaceRequest }): SagaIterator<void> {
    const { id: localId } = payload;
    console.log('Saga triggered: pullSpace', localId);
    try {
        const remoteId: SpaceId | undefined = yield call(waitForSpaceRemoteId, localId);
        if (!remoteId) {
            console.error(`pullSpace: Remote ID not found for ${localId}`);
            yield put(pullSpaceFailure(localId));
            return;
        }

        const lumoApi: LumoApi = yield getContext('lumoApi');
        const result: GetSpaceRemote | null = yield call([lumoApi, lumoApi.getSpace], remoteId);
        if (!result) {
            console.error(`pullSpace: Space ${localId} not found on server`);
            yield put(pullSpaceFailure(localId));
            return;
        }
        yield put(pullSpaceSuccess(result));
    } catch (e) {
        console.error('Error pulling space:', e);
        yield put(pullSpaceFailure(localId));
    }
}

export function* pullSpaces(): SagaIterator<void> {
    console.log('Saga triggered: pullSpaces');
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        let lastTimestamp: number | undefined;

        while (true) {
            const listSpacesArgs = lastTimestamp ? { createTimeUntil: lastTimestamp } : undefined;
            const pageResult: ListSpacesRemote = yield call([lumoApi, lumoApi.listSpaces], listSpacesArgs);
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

export function* processPullSpacesGeneric(payload: PullSpacesRemote): SagaIterator<any> {
    const { conversations, deletedConversations, deletedSpaces, spaces, assets, deletedAssets, requestFull } = payload;
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
    for (const asset of listify(deletedAssets)) {
        yield put(locallyDeleteAttachmentFromRemoteRequest(asset.id));
    }
    for (const asset of listify(assets)) {
        yield put(locallyRefreshShallowAttachmentFromRemoteRequest({ ...asset, requestFull }));
    }
}

export function* processPullSpaceResult({ payload }: { payload: GetSpaceRemote }): SagaIterator<any> {
    console.log('Saga triggered: processPullSpaceResult', payload);
    const { space, conversations, deletedConversations, assets, deletedAssets } = payload;
    const spaces: RemoteSpace[] = [];
    const deletedSpaces: RemoteDeletedSpace[] = [];
    if (!space.deleted) {
        spaces.push(space);
    } else {
        deletedSpaces.push(space);
    }
    const pagePayload: PullSpacesRemote = {
        spaces: mapify(spaces),
        deletedSpaces: mapify(deletedSpaces),
        conversations: mapify(conversations),
        deletedConversations: mapify(deletedConversations),
        assets: mapify(assets),
        deletedAssets: mapify(deletedAssets),
        requestFull: true,
    };
    yield call(processPullSpacesGeneric, pagePayload);
}

export function* processPullSpacesPage({ payload }: { payload: ListSpacesRemote }): SagaIterator<any> {
    console.log('Saga triggered: processPullSpacesPage', payload);
    const pagePayload: PullSpacesRemote = {
        ...payload,
        // we're requesting ALL spaces (upon app startup usually), don't pull children attachments now
        requestFull: false,
    };
    yield call(processPullSpacesGeneric, pagePayload);
}

export function* refreshSpaceFromRemote({
    payload: encryptedRemoteSpace,
}: {
    payload: RemoteSpace;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshSpaceFromRemote', encryptedRemoteSpace.id);
    const type = 'space';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, remoteId } = encryptedRemoteSpace;

    const masterKeyBase64 = yield select(selectMasterKey);
    if (!masterKeyBase64) {
        throw new Error(`refreshSpaceFromRemote ${localId}: no master key in state`);
    }
    const masterKey: AesKwCryptoKey = yield call(base64ToMasterKey, masterKeyBase64);
    const deserializedRemoteSpace: Space | null | undefined = yield call(
        deserializeSpace,
        encryptedRemoteSpace,
        masterKey
    );
    if (!deserializedRemoteSpace) {
        console.error(`refreshSpaceFromRemote ${localId}: cannot deserialize space`);
        return;
    }
    const remoteSpace = cleanSpace(deserializedRemoteSpace);

    const localSpace: Space | undefined = yield select(selectSpaceById(localId));
    const encryptedIdbSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], localId);

    if (localSpace) {
        const isDirty = encryptedIdbSpace?.dirty || false;

        if (isDirty) {
            console.log(`refreshSpaceFromRemote ${localId}: Local has dirty changes, keeping local`);
            return;
        }

        console.log(`refreshSpaceFromRemote ${localId}: Updating from remote`);
        yield put(addSpace(remoteSpace));
        yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false });
        return;
    }

    if (encryptedIdbSpace) {
        const idbSpace: Space | null | undefined = yield call(deserializeSpace, encryptedIdbSpace, masterKey);
        const isDirty = encryptedIdbSpace.dirty || false;

        if (isDirty && idbSpace) {
            console.log(`refreshSpaceFromRemote ${localId}: IDB has dirty changes, keeping IDB`);
            const cleanIdb = cleanSpace(idbSpace);
            yield put(addSpace(cleanIdb));
            yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: false }));
            return;
        }

        console.log(`refreshSpaceFromRemote ${localId}: Updating from remote`);
        yield put(addSpace(remoteSpace));
        yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true }));
        yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false });
        return;
    }

    console.log(`refreshSpaceFromRemote ${localId}: New space, inserting from remote`);
    yield put(addSpace(remoteSpace));
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true }));
    yield call([dbApi, dbApi.updateSpace], encryptedRemoteSpace, { dirty: false });
}
