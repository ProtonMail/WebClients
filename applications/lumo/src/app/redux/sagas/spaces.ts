import type { SagaIterator } from 'redux-saga';
import { call, delay, getContext, put, select, take } from 'redux-saga/effects';

import { base64ToMasterKey } from '../../crypto';
import type { AesKwCryptoKey } from '../../crypto/types';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi, RemoteStatus } from '../../remote/api';
import { convertNewSpaceToApi } from '../../remote/conversion';
import type { Priority } from '../../remote/scheduler';
import type { IdMapEntry, ListSpacesRemote, LocalId, RemoteId, RemoteSpace, ResourceType } from '../../remote/types';
import { deserializeSpace, serializeSpace } from '../../serialization';
import { type SerializedSpace, type Space, type SpaceId, cleanSerializedSpace, cleanSpace } from '../../types';
import { listify, mapIds } from '../../util/collections';
import { isoToUnixTimestamp } from '../../util/date';
import {
    selectAttachmentsBySpaceId,
    selectConversationsBySpaceId,
    selectMasterKey,
    selectMessagesBySpaceId,
    selectRemoteIdFromLocal,
    selectSpaceById,
} from '../selectors';
import { type AttachmentMap, deleteAllAttachments, deleteAttachment } from '../slices/core/attachments';
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

        // No PUT
        const remoteId = yield select(selectRemoteIdFromLocal(type, localId));
        if (remoteId) {
            // Space was already posted, and we don't edit spaces for now
            yield put(pushSpaceNoop(payload));
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
    const { conversations, deletedConversations, deletedSpaces, spaces } = payload;
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
}

export function* refreshSpaceFromRemote({ payload: remoteSpace }: { payload: RemoteSpace }): SagaIterator<any> {
    console.log('Saga triggered: refreshSpaceFromRemote', remoteSpace);
    const type = 'space';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, remoteId } = remoteSpace;

    // Compare with object in IDB
    console.log(`refreshSpaceFromRemote ${localId}: comparing with object in idb`);
    const idbSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], localId);
    if (idbSpace) {
        console.log(`refreshSpaceFromRemote ${localId}: idb object already exists, noop`);
        return;
    }

    // Deserialize before inserting into Redux
    console.log(`refreshSpaceFromRemote ${localId}: selecting masterkey`);
    const masterKeyBase64 = yield select(selectMasterKey);
    if (!masterKeyBase64) {
        throw new Error(`in refreshSpaceFromRemote ${localId}: no master key in state`);
    }
    console.log(`refreshSpaceFromRemote ${localId}: got masterkey`);
    const masterKey: AesKwCryptoKey = yield call(base64ToMasterKey, masterKeyBase64);
    console.log(`refreshSpaceFromRemote ${localId}: got masterkey decoded`, masterKeyBase64);
    console.log(`refreshSpaceFromRemote ${localId}: calling deserializeSpace for remote`);
    const deserializedRemoteSpace: Space | null | undefined = yield call(deserializeSpace, remoteSpace, masterKey);
    console.log(`refreshSpaceFromRemote ${localId}: got deserialized remote space result`, deserializedRemoteSpace);
    if (!deserializedRemoteSpace) {
        console.error(`refreshSpaceFromRemote ${localId}: cannot deserialize space ${localId} from remote`);
        return;
    }
    console.log(`refreshSpaceFromRemote ${localId}: selecting local space`);
    const localSpace: Space | undefined = yield select(selectSpaceById(localId));
    if (localSpace) {
        console.log(`refreshSpaceFromRemote ${localId}: received space already exists in Redux, noop`);
        return;
    }
    const cleanRemote = cleanSpace(deserializedRemoteSpace);

    // Update locally
    console.log(`refreshSpaceFromRemote ${localId}: updating locally: put(addSpace)`);
    yield put(addSpace(cleanRemote)); // Redux
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
    console.log(`refreshSpaceFromRemote ${localId}: updating locally: call(dbApi.updateSpace)`);
    yield call([dbApi, dbApi.updateSpace], remoteSpace, { dirty: false }); // IDB
}
