import isEqual from 'lodash/isEqual';
import type {SagaIterator} from 'redux-saga';
import {call, delay, fork, getContext, put, select, take} from 'redux-saga/effects';

import type {AesGcmCryptoKey} from '../../crypto/types';
import type {DbApi} from '../../indexedDb/db';
import type {LumoApi} from '../../remote/api';
import {convertNewMessageToApi} from '../../remote/conversion';
import type {Priority} from '../../remote/scheduler';
import type {IdMapEntry, LocalId, RemoteId, RemoteMessage, ResourceType} from '../../remote/types';
import {deserializeMessage, serializeMessage} from '../../serialization';
import {
    cleanMessage,
    cleanSerializedMessage,
    type Conversation,
    getSpaceDek,
    type Message,
    type SerializedMessage,
    type Space,
    type SpaceId,
} from '../../types';
import {selectConversationById, selectMessageById, selectSpaceById} from '../selectors';
import type {PullAttachmentRequest} from '../slices/core/attachments';
import {pullConversationRequest} from '../slices/core/conversations';
import {addIdMapEntry} from '../slices/core/idmap';
import {
    addMessage,
    deleteMessage,
    locallyRefreshMessageFromRemoteRequest,
    pullMessageFailure,
    pullMessageRequest,
    pullMessageSuccess,
    pushMessageFailure,
    pushMessageNeedsRetry,
    pushMessageNoop,
    type PushMessageRequest,
    type PushMessageSuccess,
    pushMessageSuccess,
} from '../slices/core/messages';
import type {LumoState} from '../store';
import {considerRequestingFullAttachment} from './attachments';
import {waitForConversation} from './conversations';
import {waitForMapping} from './idmap';
import {callWithRetry, isClientError, isConflictClientError, RETRY_PUSH_EVERY_MS} from './index';
import {waitForSpace} from './spaces';

/*** helpers ***/

export function* saveDirtyMessage(serializedMessage: SerializedMessage): SagaIterator {
    console.log('Saga triggered: saveDirtyMessage', serializedMessage);

    // Check if this message belongs to a ghost conversation - if so, skip saving to IndexedDB
    const conversation: Conversation | undefined = yield select(
        selectConversationById(serializedMessage.conversationId)
    );
    if (conversation?.ghost) {
        console.log('saveDirtyMessage: Message belongs to ghost conversation, skipping IndexedDB persistence');
        return;
    }

    const dbApi: DbApi = yield getContext('dbApi');
    yield call([dbApi, dbApi.updateMessage], serializedMessage, {
        dirty: true,
    });
}

export function* clearDirtyIfUnchanged(serializedMessage: SerializedMessage): SagaIterator<boolean> {
    console.log('Saga triggered: clearDirtyIfUnchanged', serializedMessage);
    // fixme: possibly racy between getting `fresh` and storing the object
    // fixme: consider delegating the CAS to dbApi instead, which can manage the read-then-write inside a tx
    const dbApi: DbApi = yield getContext('dbApi');
    const localId = serializedMessage.id;
    const fresh = yield call([dbApi, dbApi.getMessageById], localId);
    const { dirty: _a, ...a } = cleanSerializedMessage(fresh);
    const { dirty: _b, ...b } = cleanSerializedMessage(serializedMessage);
    const unchanged = isEqual(a, b);
    // todo improvement: dbApi.clearDirtyMessage() directly there
    if (unchanged) {
        yield call([dbApi, dbApi.updateMessage], serializedMessage, { dirty: false });
        return true;
    } else {
        console.log('clearDirtyIfUnchanged: found changed data: ', { a, b });
        return false;
    }
}

export function* serializeMessageSaga(message: Message, spaceDek?: AesGcmCryptoKey): SagaIterator<SerializedMessage> {
    const { id: localId, conversationId } = message;

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const conversation: Conversation | undefined = yield select(selectConversationById(conversationId));
        if (!conversation) {
            throw new Error(
                `serializeMessageSaga ${localId}: cannot get space dek: cannot find parent conversation ${conversationId}`
            );
        }
        const { spaceId } = conversation;

        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `serializeMessageSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    const serializedMessage: SerializedMessage | undefined = yield call(serializeMessage, message, spaceDek_);
    if (!serializedMessage) {
        throw new Error(`serializeMessageSaga ${localId}: cannot serialize message ${localId}`);
    }
    return cleanSerializedMessage(serializedMessage);
}

export function* deserializeMessageSaga(
    serializedMessage: SerializedMessage,
    spaceDek?: AesGcmCryptoKey
): SagaIterator<Message> {
    const { id: localId, conversationId } = serializedMessage;

    let spaceDek_: AesGcmCryptoKey;
    if (spaceDek) {
        spaceDek_ = spaceDek;
    } else {
        const conversation: Conversation | undefined = yield select(selectConversationById(conversationId));
        if (!conversation) {
            throw new Error(
                `deserializeMessageSaga ${localId}: cannot get space dek: cannot find parent conversation ${conversationId}`
            );
        }
        const { spaceId } = conversation;

        const space: Space | undefined = yield select(selectSpaceById(spaceId));
        if (!space) {
            throw new Error(
                `deserializeMessageSaga ${localId}: cannot get space dek: cannot find parent space ${spaceId}`
            );
        }
        spaceDek_ = yield call(getSpaceDek, space);
    }

    console.log(`deserializeMessageSaga ${localId}: calling deserializeMessage for remote`);
    const deserializedRemoteMessage: Message | null = yield call(deserializeMessage, serializedMessage, spaceDek_);
    console.log(`deserializeMessageSaga ${localId}: got deserialized remote message result`, deserializedRemoteMessage);
    if (!deserializedRemoteMessage) {
        throw new Error(`deserializeMessageSaga ${localId}: cannot deserialize message ${localId} from remote`);
    }
    return cleanMessage(deserializedRemoteMessage);
}

export function* waitForMessage(localId: LocalId): SagaIterator<Message> {
    const type = 'message';
    console.log(`Saga triggered: waitForMessage: ${type} ${localId}`);
    const mapped: Message | undefined = yield select(selectMessageById(localId));
    if (mapped) {
        console.log(`waitForMessage: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForMessage: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addMessage> = yield take(
        (a: any) => a.type === addMessage.type && a.payload.id === localId
    );
    console.log(`waitForMessage: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

/*** loggers ***/

export function* logPushMessageSuccess({ payload }: { payload: PushMessageSuccess }): SagaIterator<any> {
    console.log('Saga triggered: logPushMessageSuccess', payload);
    console.log('push message success', payload);
}

export function* logPushMessageFailure({ payload }: { payload: PushMessageRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushMessageFailure', payload);
    console.error('push message failure', payload);
}

export function* logPushMessageNoop({ payload }: { payload: PushMessageRequest }): SagaIterator<any> {
    console.log('Saga triggered: logPushMessageNoop', payload);
    console.log('push message noop', payload);
}

export function* logPullMessageFailure({ payload: remoteMessage }: { payload: RemoteMessage }): SagaIterator<any> {
    console.log('Saga triggered: logPullMessageFailure', remoteMessage);
    const { id } = remoteMessage;
    console.error(`get message ${id} failure`);
}

/*** sync: local -> remote ***/

export function* httpPostMessage(serializedMessage: SerializedMessage, priority: Priority): SagaIterator<IdMapEntry> {
    console.log('Saga triggered: httpPostMessage', serializedMessage);
    const type: ResourceType = 'message';
    const { id: localId, conversationId: localConversationId, parentId: localParentId } = serializedMessage;
    const remoteConversationId: RemoteId = yield call(waitForMapping, 'conversation', localConversationId);
    const remoteParentId: RemoteId | undefined = localParentId
        ? yield call(waitForMapping, 'message', localParentId)
        : undefined;
    const messageToApi = convertNewMessageToApi(serializedMessage, remoteConversationId, remoteParentId);
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId = yield call([lumoApi, lumoApi.postMessage], messageToApi, priority);
    const entry = { type, localId, remoteId };
    yield put(addIdMapEntry({ ...entry, saveToIdb: true }));
    return entry;
}

export function* pushMessage({ payload }: { payload: PushMessageRequest }): SagaIterator<any> {
    console.log('Saga triggered: pushMessage', payload);
    const type: ResourceType = 'message';
    const { id: localId } = payload;
    const priority = payload.priority || 'urgent';
    const message: Message | undefined = yield select(selectMessageById(localId));
    if (!message) {
        throw new Error(`cannot find ${type} ${localId} in Redux`);
    }

    // In ghost mode, skip remote persistence
    const isGhostMode: boolean = yield select((state: LumoState) => state.ghostChat?.isGhostChatMode || false);
    if (isGhostMode) {
        console.log('pushMessage: Ghost mode is enabled, skipping remote persistence');
        yield put(pushMessageSuccess(payload));
        return;
    }

    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const idbMessage: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], localId);

        // Deletion case
        if (idbMessage) {
            // If there is an object in IDB and it has deleted+dirty flags, we push the deletion and exit
            const { deleted, dirty } = idbMessage;
            if (deleted) {
                if (dirty) {
                    // DELETE
                    {
                    } // noop: we don't delete messages remotely, only their containing conv/space
                    // Clear the dirty flag in IDB, marking the deletion was synced
                    const updated: boolean = yield call(clearDirtyIfUnchanged, idbMessage);
                    // Delete from redux, and if it was done before, it's a noop
                    yield put(deleteMessage(localId));
                    if (updated) {
                        yield put(pushMessageSuccess(payload));
                    } else {
                        yield put(pushMessageNeedsRetry(payload));
                    }
                    return;
                } else {
                    // deletion was already synced, noop
                    yield put(pushMessageNoop(payload));
                    return;
                }
            }
        }

        if (message.placeholder) {
            console.log('pushMessage: message has a placeholder flag, not pushing now, will retry later');
            yield put(pushMessageNeedsRetry(payload));
            return;
        }

        const serializedMessage: SerializedMessage = yield call(serializeMessageSaga, message);

        // Save the message to IndexedDB with a dirty flag
        yield call(saveDirtyMessage, serializedMessage);
        const remoteId = yield select((s: LumoState) => s.idmap.local2remote[type][localId]);
        if (remoteId) {
            yield put(pushMessageNoop(payload));
            return;
        }

        // It can only be POST, we don't edit messages for now
        const entry = yield call(callWithRetry, httpPostMessage, [serializedMessage, priority]);

        // Clear the dirty flag unless it changed in the meantime
        const updated = yield call(clearDirtyIfUnchanged, serializedMessage);
        if (!updated) {
            throw new Error(
                'POST message was successful, but clearing the dirty flag failed due to message having changed since posting'
            );
        }
        yield put(pushMessageSuccess({ ...payload, entry }));
    } catch (e) {
        // Retry unless it's a 4xx client error (in which case we expect retrying to fail again).
        // Special case: if 409, we try to re-fetch data to resolve the missing pieces (in this case a local-to-remote
        // id mapping).
        console.error(e);
        if (isConflictClientError(e)) {
            // 409 Conflict. We end up here because the server has a remote id for this resource (so it is rejecting our
            // POST request) but locally we don't actually know what is that remote id. Indeed, we only ever POST when
            // we don't have a local-to-remote id mapping.
            // To solve this, we ask for the conversation object, containing the message listing, in the hope that the
            // problematic message will be in the list (which is likely).
            // And in that list, it will contain both the remote id and the local id (aka tag). Recording the
            // local-to-remote id mapping will stop this message from being POSTed again because, as we said above, we
            // only POST resources having no id mapping.
            // Recording that id mapping is done as part of the normal flow of processing the pullConversation response.
            const conversationId = message.conversationId;
            if (conversationId) {
                yield put(pullConversationRequest({ id: conversationId }));
            }
            yield put(pushMessageNeedsRetry(payload));
        } else if (isClientError(e)) {
            yield put(pushMessageFailure({ ...payload, error: `${e}` }));
        } else {
            yield put(pushMessageNeedsRetry(payload));
        }
    }
}

export function* retryPushMessage({ payload }: { payload: PushMessageRequest }): SagaIterator<any> {
    console.log('Saga triggered: retryPushMessage', payload);
    yield delay(RETRY_PUSH_EVERY_MS);
    yield call(pushMessage, { payload: { ...payload, priority: 'background' } });
}

/*** sync: remote -> local ***/

export function* refreshMessageFromRemote({ payload: remoteMessage }: { payload: RemoteMessage }): SagaIterator<any> {
    console.log('Saga triggered: refreshMessageFromRemote', remoteMessage);
    const type = 'message';
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId, conversationId: localConversationId, remoteId } = remoteMessage;

    // Update the remote id mapping
    yield put(addIdMapEntry({ type, localId, remoteId, saveToIdb: true })); // Redux

    // Compare with object in Redux
    const localConversation: Conversation = yield call(waitForConversation, localConversationId);
    const localSpaceId: SpaceId = localConversation.spaceId;
    const localSpace: Space = yield call(waitForSpace, localSpaceId);
    const spaceDek: AesGcmCryptoKey = yield call(getSpaceDek, localSpace);
    const deserializedRemoteMessage: Message | null = yield call(deserializeMessage, remoteMessage, spaceDek);
    if (!deserializedRemoteMessage) {
        console.error(`refreshMessageFromRemote: cannot deserialize message ${localId} from remote`);
        return;
    }
    const cleanRemote = cleanMessage(deserializedRemoteMessage);
    const localMessage: Message | undefined = yield select(selectMessageById(localId));
    if (localMessage) {
        const cleanLocal = cleanMessage(localMessage);
        if (localMessage.placeholder) {
            console.log('refreshMessageFromRemote: Redux message is placeholder, noop');
            return;
        }
        if (isEqual(cleanRemote, cleanLocal)) {
            console.log('refreshMessageFromRemote: received message is the same as the one in Redux, noop');
            return;
        }
    }

    // Compare with object in IDB
    const idbMessage: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], localId);
    if (idbMessage) {
        if (idbMessage.dirty) {
            console.log(
                `message ${localId}: idb object is dirty, but we received a remote object: clearing dirty flag`
            );
            yield call([dbApi, dbApi.updateMessage], idbMessage, { dirty: false }); // IDB
        }
        if (idbMessage.encrypted && !remoteMessage.encrypted) {
            console.log(`message ${localId}: remote object is shallow while IDB object is filled, noop`);
            return;
        }
        const cleanSerializedRemote = cleanSerializedMessage(remoteMessage);
        const cleanSerializedLocal = cleanSerializedMessage(idbMessage);
        if (isEqual(cleanSerializedRemote, cleanSerializedLocal)) {
            console.log('refreshMessageFromRemote: received message is the same as the one in IDB, noop');
            return;
        }
    }

    // Fetch shallow attachments if they exist
    const attachments = cleanRemote.attachments ?? [];
    for (const shallowAttachment of attachments) {
        const { id, spaceId } = shallowAttachment;
        if (spaceId) {
            const request: PullAttachmentRequest = { id, spaceId };
            yield fork(considerRequestingFullAttachment, { payload: request });
        } else {
            console.log('refreshShallowAttachmentFromRemote: attachment has no space id, cannot pull full attachment');
        }
    }

    // Update locally
    yield put(addMessage(cleanRemote)); // Redux
    yield call([dbApi, dbApi.updateMessage], remoteMessage, { dirty: false }); // IDB
}

export function* pullMessage({ payload: shallowRemoteMessage }: { payload: RemoteMessage }): SagaIterator<void> {
    console.log('Saga triggered: getMessage', shallowRemoteMessage);
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        const {
            conversationId: localConversationId,
            id: localId,
            parentId: localParentId,
            remoteConversationId,
            remoteId,
        } = shallowRemoteMessage;
        const fullRemoteMessage: RemoteMessage | null = yield call(
            [lumoApi, lumoApi.getMessage],
            remoteId,
            localConversationId,
            localParentId,
            remoteConversationId
        );
        if (!fullRemoteMessage) {
            console.log(`Message ${localId} has been deleted remotely, noop`);
            return;
        }
        yield put(pullMessageSuccess(fullRemoteMessage));
    } catch (e) {
        console.error('Error pulling message:', e);
        yield put(pullMessageFailure(shallowRemoteMessage));
    }
}

export function* processPullMessageResult({ payload: remoteMessage }: { payload: RemoteMessage }): SagaIterator<any> {
    console.log('Saga triggered: processGetMessage', remoteMessage);
    console.log('get message success' /* , payload */);
    if (remoteMessage.deleted) {
        // Messages are deleted with the space that contains it using a cascade deletion
        // No need to delete it here
    } else {
        yield put(locallyRefreshMessageFromRemoteRequest(remoteMessage));
        if (!remoteMessage.encrypted) {
            yield fork(considerRequestingFullMessage, { payload: remoteMessage });
        }
    }
}

export function* considerRequestingFullMessage({
    payload: remoteMessage,
}: {
    payload: RemoteMessage;
}): SagaIterator<any> {
    console.log('Saga triggered: considerRequestingFullMessage', remoteMessage);
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId } = remoteMessage;

    // Compare with object in IDB
    const idbMessage: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], localId);
    if (idbMessage && idbMessage.encrypted) {
        console.log(`considerRequestingMessage: Message ${localId} is already filled locally, not requesting`);
        return;
    }
    console.log(`considerRequestingMessage: Message ${localId} will be requested`);
    yield put(pullMessageRequest(remoteMessage));
}
