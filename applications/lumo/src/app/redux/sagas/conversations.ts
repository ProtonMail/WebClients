import isEqual from 'lodash/isEqual';
import type {SagaIterator} from 'redux-saga';
import {call, delay, fork, getContext, put, select, take} from 'redux-saga/effects';

import type {AesGcmCryptoKey} from '../../crypto/types';
import type {DbApi} from '../../indexedDb/db';
import type {LumoApi, RemoteStatus} from '../../remote/api';
import {convertConversationToApi, convertNewConversationToApi} from '../../remote/conversion';
import type {Priority} from '../../remote/scheduler';
import type {
    GetConversationRemote,
    IdMapEntry,
    LocalId,
    RemoteConversation,
    RemoteId,
    ResourceType,
} from '../../remote/types';
import {deserializeConversation, serializeConversation} from '../../serialization';
import {
    cleanConversation,
    cleanSerializedConversation,
    type Conversation,
    type ConversationId,
    type DeletedConversation,
    getSpaceDek,
    type SerializedConversation,
    type Space,
} from '../../types';
import {selectConversationById, selectRemoteIdFromLocal, selectSpaceByConversationId} from '../selectors';
import {
    addConversation,
    deleteConversation,
    locallyDeleteConversationFromRemoteRequest,
    locallyRefreshConversationFromRemoteRequest,
    pullConversationFailure,
    type PullConversationRequest,
    pullConversationSuccess,
    type PushConversationFailure,
    pushConversationFailure,
    pushConversationNeedsRetry,
    pushConversationNoop,
    type PushConversationRequest,
    pushConversationRequest,
    type PushConversationSuccess,
    pushConversationSuccess,
} from '../slices/core/conversations';
import {addIdMapEntry} from '../slices/core/idmap';
import {locallyRefreshMessageFromRemoteRequest} from '../slices/core/messages';
import type {LumoState} from '../store';
import {waitForMapping} from './idmap';
import {callWithRetry, ClientError, isClientError, RETRY_PUSH_EVERY_MS} from './index';
import {considerRequestingFullMessage} from './messages';
import {waitForSpace} from './spaces';

/*** helpers ***/

function* saveDirtyConversation(serializedConversation: SerializedConversation): SagaIterator {
    console.log('Saga triggered: saveDirtyConversation', serializedConversation);

    // Check if this is a ghost conversation - if so, skip saving to IndexedDB
    const conversation: Conversation | undefined = yield select(selectConversationById(serializedConversation.id));
    if (conversation?.ghost) {
        console.log('saveDirtyConversation: Ghost conversation detected, skipping IndexedDB persistence');
        return;
    }

    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.updateConversation], serializedConversation, {
        dirty: true,
    });
}

function* clearDirtyIfUnchanged(serializedConversation: SerializedConversation): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirtyIfUnchanged', serializedConversation);
    // fixme: possibly racy between getting `fresh` and storing the object
    // fixme: consider delegating the CAS to dbApi instead, which can manage the read-then-write inside a tx
    const dbApi: DbApi = yield getContext('dbApi');
    const localId = serializedConversation.id;
    const fresh = yield call([dbApi, dbApi.getConversationById], localId);
    const { dirty: _a, ...a } = cleanSerializedConversation(fresh);
    const { dirty: _b, ...b } = cleanSerializedConversation(serializedConversation);
    const unchanged = isEqual(a, b);
    // todo improvement: dbApi.clearDirtyConversation() directly there
    if (unchanged) {
        yield call([dbApi, dbApi.updateConversation], serializedConversation, { dirty: false });
        return true;
    } else {
        console.log('clearDirtyIfUnchanged: found changed data: ', { a, b });
        return false;
    }
}

export function* waitForConversation(localId: LocalId): SagaIterator<Conversation> {
    const type = 'conversation';
    console.log(`Saga triggered: waitForConversation: ${type} ${localId}`);
    const mapped: Conversation | undefined = yield select(selectConversationById(localId));
    if (mapped) {
        console.log(`waitForConversation: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForConversation: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addConversation> = yield take(
        (a: any) => a.type === addConversation.type && a.payload.id === localId
    );
    console.log(`waitForConversation: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

export function* serializeConversationSaga(
    conversation: Conversation,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<SerializedConversation> {
    const { id: localId } = conversation;

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceByConversationId(localId));
        if (!space) {
            throw new Error(`serializeConversationSaga ${localId}: cannot get space dek: cannot find parent space`);
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    const serializedConversation: SerializedConversation | undefined = yield call(
        serializeConversation,
        conversation,
        spaceDek_
    );
    if (!serializedConversation) {
        throw new Error(`serializeConversationSaga ${localId}: cannot serialize conversation ${localId}`);
    }
    return cleanSerializedConversation(serializedConversation);
}

export function* deserializeConversationSaga(
    serializedConversation: SerializedConversation,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<Conversation> {
    const { id: localId } = serializedConversation;

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const space: Space | undefined = yield select(selectSpaceByConversationId(localId));
        if (!space) {
            throw new Error(`serializeConversationSaga ${localId}: cannot get space dek: cannot find parent space`);
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    console.log(`deserializeConversationSaga ${localId}: calling deserializeConversation for remote`);
    const deserializedRemoteConversation: Conversation | null = yield call(
        deserializeConversation,
        serializedConversation,
        spaceDek_
    );
    console.log(
        `deserializeConversationSaga ${localId}: got deserialized remote conversation result`,
        deserializedRemoteConversation
    );
    if (!deserializedRemoteConversation) {
        throw new Error(
            `deserializeConversationSaga ${localId}: cannot deserialize conversation ${localId} from remote`
        );
    }
    return cleanConversation(deserializedRemoteConversation);
}

export function* softDeleteConversationFromRemote({
    payload: localId,
}: {
    payload: ConversationId;
}): SagaIterator<any> {
    console.log('Saga triggered: softDeleteConversationFromRemote', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteConversation(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteConversation], localId, { dirty: false }); // IDB
}

export function* softDeleteConversationFromLocal({ payload: localId }: { payload: ConversationId }): SagaIterator<any> {
    console.log('Saga triggered: softDeleteConversationFromLocal', localId);
    const dbApi: DbApi = yield getContext('dbApi');
    yield put(deleteConversation(localId)); // Redux
    yield call([dbApi, dbApi.softDeleteConversation], localId, { dirty: true }); // IDB

    // Trigger push to sync deletion to server
    console.log(`softDeleteConversationFromLocal: triggering push for deleted conversation ${localId}`);
    yield put(pushConversationRequest({ id: localId, priority: 'urgent' }));
}

/*** loggers ***/

export function* logPushConversationSuccess({ payload }: { payload: PushConversationSuccess }): SagaIterator<any> {
    console.log('Saga triggered: logPushConversationSuccess', payload);
    console.log('push conversation success', payload);
}

export function* logPushConversationFailure({ payload }: { payload: PushConversationFailure }): SagaIterator<any> {
    console.log('Saga triggered: logPushConversationFailure', payload);
    console.error('push conversation failure', payload);
}

export function* logPullConversationFailure({
    payload: conversationId,
}: {
    payload: ConversationId;
}): SagaIterator<any> {
    console.log('Saga triggered: logPullConversationFailure', conversationId);
    console.error(`get conversation ${conversationId} failure`);
}

/*** sync: local -> remote ***/

function* httpPostConversation(
    serializedConversation: SerializedConversation,
    priority: Priority
): SagaIterator<IdMapEntry> {
    console.log('Saga triggered: httpPostConversation', serializedConversation);
    const type: ResourceType = 'conversation';
    const { id: localId, spaceId: localSpaceId } = serializedConversation;
    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    const conversationToApi = convertNewConversationToApi(serializedConversation, remoteSpaceId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postConversation], conversationToApi, priority);
    if (!remoteId) {
        throw new ClientError(`client error while posting ${type} ${localId}, not retrying`);
    }
    const entry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return entry;
}

function* httpPutConversation(
    serializedConversation: SerializedConversation,
    remoteId: RemoteId,
    priority: Priority
): SagaIterator<any> {
    console.log('Saga triggered: httpPutConversation', { serializedConversation, remoteId });
    const type: ResourceType = 'conversation';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const { id: localId, spaceId: localSpaceId } = serializedConversation;
    const remoteSpaceId: RemoteId = yield call(waitForMapping, 'space', localSpaceId);
    // const remoteId: RemoteId = yield call(waitForMapping, type, localId);
    const conversationToApi = convertConversationToApi(serializedConversation, remoteId, remoteSpaceId);
    const status: RemoteStatus = yield call([lumoApi, lumoApi.putConversation], conversationToApi, priority);
    if (status === 'deleted') {
        console.log(`PUT ${type}: ${localId} was deleted remotely, deleting also locally: ${localId} ${remoteId})`);
        const deletedConversation: DeletedConversation = { ...serializedConversation, deleted: true };
        yield put(locallyDeleteConversationFromRemoteRequest(deletedConversation.id));
    }
}

function* httpDeleteConversation(localId: LocalId, remoteId: RemoteId, priority: Priority): SagaIterator<RemoteStatus> {
    console.log('Saga triggered: httpDeleteConversation', { localId, remoteId });
    const type: ResourceType = 'conversation';
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const status: RemoteStatus = yield call([lumoApi, lumoApi.deleteConversation], remoteId, priority);
    if (status === 'deleted') {
        console.log(`DELETE ${type}: ${localId} was already deleted remotely, so the http delete was a noop`);
    }
    return status;
}

export function* pushConversation({ payload }: { payload: PushConversationRequest }): SagaIterator<any> {
    console.log('Saga triggered: pushConversation', payload);
    const type: ResourceType = 'conversation';
    const { id: localId } = payload;
    const priority = payload.priority || 'urgent';

    // Check if phantom chat mode is enabled - if so, skip remote persistence
    const isGhostChatMode: boolean = yield select((state: LumoState) => state.ghostChat?.isGhostChatMode || false);
    if (isGhostChatMode) {
        console.log('pushConversation: Phantom chat mode is enabled, skipping remote persistence');
        yield put(pushConversationSuccess(payload));
        return;
    }

    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const remoteId: RemoteId | undefined = yield select(selectRemoteIdFromLocal(type, localId));
        const idbConversation: SerializedConversation | undefined = yield call(
            [dbApi, dbApi.getConversationById],
            localId
        );

        // Deletion case
        if (idbConversation) {
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            const { deleted, dirty } = idbConversation;
            if (deleted) {
                if (dirty) {
                    // DELETE
                    if (remoteId) {
                        const deleteArgs: [LocalId, RemoteId, Priority] = [localId, remoteId, priority];
                        yield call(callWithRetry, httpDeleteConversation, deleteArgs);
                    }
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbConversation);
                    // Delete from redux, and if it was done before, it's a noop
                    yield put(deleteConversation(localId));
                    yield put(updated ? pushConversationSuccess(payload) : pushConversationNeedsRetry(payload));
                    return;
                } else {
                    // deletion was already synced, noop
                    yield put(pushConversationNoop(payload));
                    return;
                }
            }
        }

        // Encrypt the conversation for IDB and the remote
        const conversation: Conversation | undefined = yield select(selectConversationById(localId));
        if (!conversation) throw new Error(`cannot find ${type} ${localId} in Redux`);
        const serializedConversation: SerializedConversation = yield call(serializeConversationSaga, conversation);

        // Save the conversation to IndexedDB with a dirty flag
        yield call(saveDirtyConversation, serializedConversation);

        // Choose between POST or PUT
        let entry: IdMapEntry | undefined;
        if (!remoteId) {
            // POST
            entry = yield call(callWithRetry, httpPostConversation, [serializedConversation, priority]);
        } else {
            // PUT
            yield call(callWithRetry, httpPutConversation, [serializedConversation, remoteId, priority]);
        }

        // Finish
        const updated: boolean = yield call(clearDirtyIfUnchanged, serializedConversation);
        yield put(updated ? pushConversationSuccess({ ...payload, entry }) : pushConversationNeedsRetry(payload));
    } catch (e) {
        // Retry unless it's a 4xx client error (in which case we expect retrying to fail again)
        console.error(e);
        if (isClientError(e)) {
            yield put(pushConversationFailure({ ...payload, error: `${e}` }));
        } else {
            yield put(pushConversationNeedsRetry(payload));
        }
    }
}

export function* retryPushConversation({ payload }: { payload: PushConversationRequest }): SagaIterator<any> {
    console.log('Saga triggered: retryPushConversation', payload);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield call(pushConversation, { payload: { ...payload, priority: 'background' } });
}

/*** sync: remote -> local ***/

export function* refreshConversationFromRemote({
    payload: remoteConversation,
}: {
    payload: RemoteConversation;
}): SagaIterator<any> {
    console.log('Saga triggered: refreshConversationFromRemote', remoteConversation);
    const type = 'conversation';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, spaceId: localSpaceId, remoteId } = remoteConversation;

    // Compare with object in Redux
    const localSpace: Space = yield call(waitForSpace, localSpaceId);
    const spaceDek: AesGcmCryptoKey = yield call(getSpaceDek, localSpace);
    const deserializedRemoteConversation: Conversation | null = yield call(
        deserializeConversation,
        remoteConversation,
        spaceDek
    );
    if (!deserializedRemoteConversation) {
        console.error(`refreshConversationFromRemote: cannot deserialize conversation ${localId} from remote`);
        return;
    }
    const cleanRemote = cleanConversation(deserializedRemoteConversation);
    const localConversation: Conversation | undefined = yield select(selectConversationById(localId));
    if (localConversation) {
        const cleanLocal = cleanConversation(localConversation);
        if (isEqual(cleanRemote, cleanLocal)) {
            console.log('refreshConversationFromRemote: received conv is the same as the one in Redux, noop');
            return;
        }
    }

    // Compare with object in IDB
    const idbConversation: SerializedConversation | undefined = yield call([dbApi, dbApi.getConversationById], localId);
    if (idbConversation) {
        if (idbConversation.dirty) {
            console.log(
                `Received a remote refresh for conversation ${localId}, but it is marked dirty locally, not updating`
            );
            return;
        }
        const cleanSerializedRemote = cleanSerializedConversation(remoteConversation);
        const cleanSerializedLocal = cleanSerializedConversation(idbConversation);
        if (isEqual(cleanSerializedRemote, cleanSerializedLocal)) {
            console.log('refreshConversationFromRemote: received conv is the same as the one in IDB, noop');
            return;
        }
    }

    // Update locally
    yield put(addConversation(cleanRemote)); // Redux
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux
    yield call([dbApi, dbApi.updateConversation], remoteConversation, { dirty: false }); // IDB
}

export function* pullConversation({
    payload: { id: localId },
}: {
    payload: PullConversationRequest;
}): SagaIterator<void> {
    console.log('Saga triggered: pullConversation', localId);
    const type = 'conversation';
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        const remoteId: RemoteId | undefined = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
        if (!remoteId) {
            console.error(`GET ${type} ${localId}: Remote ID not found`);
            return;
        }
        const conversation: Conversation | undefined = yield select(selectConversationById(localId));
        if (!conversation) {
            console.log(`GET ${type} ${localId}: Cannot GET a conversation that isn't yet pushed to the server`);
            return;
        }
        const localSpaceId = conversation.spaceId;
        const result: GetConversationRemote = yield call([lumoApi, lumoApi.getConversation], remoteId, localSpaceId);
        yield put(pullConversationSuccess(result));
    } catch (e) {
        console.error('Error pulling conversation:', e);
        yield put(pullConversationFailure(localId));
    }
}

export function* processPullConversationResult({ payload }: { payload: GetConversationRemote }): SagaIterator<any> {
    console.log('Saga triggered: processPullConversationResult', payload);
    const { conversation, messages } = payload;
    if (conversation.deleted) {
        yield put(locallyDeleteConversationFromRemoteRequest(conversation.id));
    } else {
        yield put(locallyRefreshConversationFromRemoteRequest(conversation));
        for (const remoteMessage of messages) {
            yield put(locallyRefreshMessageFromRemoteRequest(remoteMessage));
            yield fork(considerRequestingFullMessage, { payload: remoteMessage });
        }
    }
}
