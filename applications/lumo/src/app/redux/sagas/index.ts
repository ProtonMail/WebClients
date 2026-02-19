// Redux sagas for handling async operations and side effects
import type { Saga, SagaIterator } from 'redux-saga';
import {
    all,
    call,
    cancel,
    delay,
    getContext,
    put,
    select,
    spawn,
    take,
    takeEvery,
    takeLeading,
} from 'redux-saga/effects';

import type { AesGcmCryptoKey } from '../../crypto/types';
import {
    ASSET_STORE,
    ATTACHMENT_STORE,
    CONVERSATION_STORE,
    type DbApi,
    MESSAGE_STORE,
    REMOTE_ID_STORE,
    SPACE_STORE,
    type UnsyncedMaps,
} from '../../indexedDb/db';
import { SearchService } from '../../services/search/searchService';
import {
    type Attachment,
    type Conversation,
    type ConversationId,
    type Message,
    type Space,
    type SpaceId,
    getSpaceDek,
} from '../../types';
import { mapEmpty, mapIds, mapLength } from '../../util/collections';
import { reloadReduxRequest, stopRootSaga, unloadReduxRequest } from '../slices/core';
import {
    addAttachment,
    deleteAllAttachments,
    indexAttachmentRequest,
    locallyDeleteAttachmentFromLocalRequest,
    locallyDeleteAttachmentFromRemoteRequest,
    locallyRefreshFilledAttachmentFromRemoteRequest,
    locallyRefreshShallowAttachmentFromRemoteRequest,
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
import {
    addConversation,
    deleteAllConversations,
    locallyDeleteConversationFromLocalRequest,
    locallyDeleteConversationFromRemoteRequest,
    locallyRefreshConversationFromRemoteRequest,
    pullConversationFailure,
    pullConversationRequest,
    pullConversationSuccess,
    pushConversationFailure,
    pushConversationNeedsRetry,
    pushConversationRequest,
    pushConversationSuccess,
} from '../slices/core/conversations';
import { addMasterKey } from '../slices/core/credentials';
import { addIdMapEntry, deleteAllIdMaps } from '../slices/core/idmap';
import {
    addMessage,
    deleteAllMessages,
    locallyRefreshMessageFromRemoteRequest,
    pullMessageFailure,
    pullMessageRequest,
    pullMessageSuccess,
    pushMessageFailure,
    pushMessageNeedsRetry,
    pushMessageNoop,
    pushMessageRequest,
    pushMessageSuccess,
} from '../slices/core/messages';
import {
    addSpace,
    deleteAllSpaces,
    deleteAllSpacesFailure,
    deleteAllSpacesRequest,
    deleteAllSpacesSuccess,
    locallyDeleteSpaceFromLocalRequest,
    locallyDeleteSpaceFromRemoteRequest,
    locallyRefreshSpaceFromRemoteRequest,
    pullSpaceFailure,
    pullSpaceRequest,
    pullSpaceSuccess,
    pullSpacesFailure,
    pullSpacesPageResponse,
    pullSpacesRequest,
    pullSpacesSuccess,
    pushSpaceFailure,
    pushSpaceNeedsRetry,
    pushSpaceNoop,
    pushSpaceRequest,
    pushSpaceSuccess,
} from '../slices/core/spaces';
import { setReduxLoadedFromIdb } from '../slices/meta/initialization';
import type { LumoState } from '../store';
import {
    deserializeAttachmentSaga,
    indexAttachment,
    logPullAttachmentFailure,
    logPushAttachmentFailure,
    logPushAttachmentNoop,
    logPushAttachmentSuccess,
    processPullAttachmentResult,
    pullAttachment,
    pushAttachment,
    refreshFilledAttachmentFromRemote,
    refreshShallowAttachmentFromRemote,
    retryPushAttachment,
    softDeleteAttachmentFromLocal,
    softDeleteAttachmentFromRemote,
    unindexAttachment,
} from './attachments';
import {
    deserializeConversationSaga,
    logPullConversationFailure,
    logPushConversationFailure,
    logPushConversationSuccess,
    processPullConversationResult,
    pullConversation,
    pushConversation,
    refreshConversationFromRemote,
    retryPushConversation,
    softDeleteConversationFromLocal,
    softDeleteConversationFromRemote,
} from './conversations';
import { considerSavingIdMapToIdb } from './idmap';
import {
    deserializeMessageSaga,
    logPullMessageFailure,
    logPushMessageFailure,
    logPushMessageNoop,
    logPushMessageSuccess,
    processPullMessageResult,
    pullMessage,
    pushMessage,
    refreshMessageFromRemote,
    retryPushMessage,
} from './messages';
import {
    deserializeSpaceSaga,
    handleDeleteAllSpaces,
    logDeleteAllSpacesFailure,
    logDeleteAllSpacesSuccess,
    logPullSpaceFailure,
    logPullSpacesFailure,
    logPullSpacesSuccess,
    logPushSpaceFailure,
    logPushSpaceNoop,
    logPushSpaceSuccess,
    processPullSpaceResult,
    processPullSpacesPage,
    pullSpace,
    pullSpaces,
    pushSpace,
    refreshSpaceFromRemote,
    retryPushSpace,
    softDeleteSpaceFromLocal,
    softDeleteSpaceFromRemote,
} from './spaces';

export let RETRY_PUSH_EVERY_MS = 30000;

export function setRetryPushEveryMs(ms: number) {
    RETRY_PUSH_EVERY_MS = ms;
}

export type SagaReturnType<F extends (...args: any[]) => any> = ReturnType<F> extends SagaIterator<infer R> ? R : never;

export class ClientError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ClientError.prototype);
        this.name = 'ClientError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClientError);
        }
    }
}

export class ConflictClientError extends ClientError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ConflictClientError.prototype);
        this.name = 'ConflictClientError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConflictClientError);
        }
    }
}

export function isClientError(err: unknown): err is ClientError {
    return err instanceof ClientError;
}

export function isConflictClientError(err: unknown): err is ConflictClientError {
    return err instanceof ConflictClientError;
}

export function callWithRetry<R>(
    fn: (...args: any[]) => Promise<R>,
    args: any[],
    maxRetries?: number,
    baseDelay?: number
): SagaIterator<R>;
export function callWithRetry<R>(
    fn: (...args: any[]) => SagaIterator<R>,
    args: any[],
    maxRetries?: number,
    baseDelay?: number
): SagaIterator<R>;
export function* callWithRetry<R>(fn: any, args: any[] = [], maxRetries = 3, baseDelay = 500): SagaIterator<R> {
    let attempt = 0;
    while (true) {
        try {
            // works whether fn is an async fn or a generator fn
            return yield call(fn, ...args);
        } catch (err) {
            if (++attempt >= maxRetries) throw err;
            yield delay(baseDelay * 2 ** (attempt - 1));
        }
    }
}

/**
 * Wraps a saga so that calls with the same action.payload.id
 * are queued and run one-by-one.
 */
export function noRaceSameId<A extends { payload: { id: string } }>(
    worker: (action: A) => SagaIterator
): Saga<[action: A]> {
    const queues: Record<string, A[]> = {};
    const processing: Record<string, boolean> = {};

    return function* (action: A): SagaIterator {
        const id = action.payload.id;
        queues[id] = queues[id] || [];
        queues[id].push(action);

        if (!processing[id]) {
            try {
                processing[id] = true;
                while (queues[id].length) {
                    const next = queues[id].shift()! as A;
                    try {
                        // blocks until this one finishes
                        yield call(worker, next);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } finally {
                processing[id] = false;
            }
        }
    };
}

/**
 * Wraps a saga so that calls with the same action.payload.id
 * are ignored if one is already running.
 */
export function dedupSameId<A extends { payload: { id: string } }>(
    worker: (action: A) => SagaIterator
): Saga<[action: A]> {
    const processing: Record<string, boolean> = {};

    return function* (action: A): SagaIterator {
        const id = action.payload.id;
        if (!processing[id]) {
            processing[id] = true;
            try {
                yield call(worker, action);
            } catch (e) {
                console.error(e);
            } finally {
                processing[id] = false;
            }
        }
    };
}

export function* loadReduxFromIdb(): SagaIterator {
    console.log('Saga triggered: loadReduxFromIdb');
    const dbApi: DbApi = yield getContext('dbApi');

    const getAllIdbData = () => {
        const stores = [SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE, ATTACHMENT_STORE, ASSET_STORE, REMOTE_ID_STORE];
        // prettier-ignore
        return dbApi.newTransaction(stores, 'readonly')
            .then(tx => ({tx}))
            .then(({tx, ...rest}) => dbApi.getAllIdMaps(tx).then((idMapEntries) => ({tx, ...rest, idMapEntries})))
            .then(({tx, ...rest}) => dbApi.getAllSpaces(tx).then((spaces) => ({tx, ...rest, spaces})))
            .then(({tx, ...rest}) => dbApi.getAllConversations(tx).then((conversations) => ({
                tx, ...rest,
                conversations
            })))
            .then(({tx, ...rest}) => dbApi.getAllMessages(tx).then((messages) => ({tx, ...rest, messages})))
            .then(({tx, ...rest}) => dbApi.getAllAttachments(tx).then((attachments) => ({tx, ...rest, attachments})))
            .then(({tx, ...rest}) => dbApi.getAllAssets(tx).then((assets) => ({tx, ...rest, assets})))
            .then(({tx, ...rest}) => rest)
    };

    const allIdbData = yield call(getAllIdbData);
    const { idMapEntries, spaces, conversations, messages } = allIdbData;

    for (const entry of idMapEntries) {
        try {
            yield put(addIdMapEntry({ ...entry, saveToIdb: false }));
        } catch (e) {
            console.warn('Error while loading Redux state from IndexedDB:', e);
        }
    }

    const spaceDekMap: Record<SpaceId, AesGcmCryptoKey> = {};
    const spaceStats = { total: spaces.length, deleted: 0, loaded: 0, failed: 0, projects: 0 };
    for (const serializedSpace of spaces) {
        try {
            const { id, deleted } = serializedSpace;
            if (deleted) {
                spaceStats.deleted++;
                continue;
            }
            const space: Space = yield call(deserializeSpaceSaga, serializedSpace);
            yield put(addSpace(space));
            spaceStats.loaded++;
            if (space.isProject) {
                spaceStats.projects++;
            }
            if (!spaceDekMap[id]) {
                spaceDekMap[id] = yield call(getSpaceDek, space);
            }
        } catch (e) {
            spaceStats.failed++;
            console.warn(`Error loading space ${serializedSpace?.id} from IndexedDB:`, e);
        }
    }
    console.log('[loadReduxFromIdb] Space loading stats:', spaceStats);

    const spaceDekMapByConversation: Record<ConversationId, AesGcmCryptoKey> = {};
    for (const serializedConversation of conversations) {
        try {
            const { id, spaceId, deleted } = serializedConversation;
            if (deleted) continue;
            const spaceDek = spaceDekMap[spaceId];
            if (!spaceDek) {
                throw new Error(`deserializing conversation ${id} failed: cannot get space dek for space ${spaceId}`);
            }
            const conversation: Conversation = yield call(
                deserializeConversationSaga,
                serializedConversation,
                spaceDek
            );
            yield put(addConversation(conversation));
            spaceDekMapByConversation[id] = spaceDek;
        } catch (e) {
            console.warn('Error while loading Redux state from IndexedDB:', e);
        }
    }

    for (const serializedMessage of messages) {
        try {
            const { id, conversationId, deleted } = serializedMessage;
            if (deleted) continue;
            const spaceDek = spaceDekMapByConversation[conversationId];
            if (!spaceDek) {
                throw new Error(
                    `deserializing message ${id} failed: cannot get space dek for conversation ${conversationId}`
                );
            }
            const message: Message = yield call(deserializeMessageSaga, serializedMessage, spaceDek);
            yield put(addMessage(message));
        } catch (e) {
            console.warn('Error while loading Redux state from IndexedDB:', e);
        }
    }

    // Load attachments from IDB
    const { attachments } = allIdbData;
    for (const serializedAttachment of attachments) {
        try {
            const { id, spaceId, deleted } = serializedAttachment;
            if (deleted) continue;
            const spaceDek = spaceDekMap[spaceId];
            if (!spaceDek) {
                console.warn(`deserializing attachment ${id} failed: cannot get space dek for space ${spaceId}`);
                continue;
            }
            const attachment: Attachment = yield call(deserializeAttachmentSaga, serializedAttachment, spaceDek);
            // Cache is populated inside deserializeAttachmentSaga
            yield put(addAttachment(attachment));
        } catch (e) {
            console.warn('Error while loading attachment from IndexedDB:', e);
        }
    }

    // Reindex uploaded assets into the search service
    // This ensures project files are available for RAG after app restart
    yield spawn(reindexUploadedAttachments);

    yield put(setReduxLoadedFromIdb());
}

/**
 * Saga to reindex uploaded attachments (non-Drive files) for search.
 * Runs after attachments are loaded from IDB to ensure they're indexed for RAG.
 */
function* reindexUploadedAttachments(): SagaIterator {
    try {
        // Get userId from Redux state
        const userId: string | undefined = yield select((state: LumoState) => state.user?.value?.ID);
        if (!userId) {
            console.log('[reindexUploadedAttachments] No userId available, skipping');
            return;
        }

        // TODO: the filtering logic below would be better as a Redux selector on the attachments slice

        // Get attachments and spaces from Redux state
        const attachments: Record<string, Attachment> = yield select((state: LumoState) => state.attachments);
        const spaces: Record<string, Space> = yield select((state: LumoState) => state.spaces);
        const validSpaceIds = new Set(Object.keys(spaces));

        const attachmentList = Object.values(attachments);

        // Filter to project attachments that:
        // - Have spaceId and markdown content
        // - Are not from Drive (no driveNodeId)
        // - Belong to a space that still exists
        const projectAttachments = attachmentList.filter(
            (attachment) =>
                attachment.spaceId &&
                attachment.markdown &&
                !attachment.driveNodeId &&
                validSpaceIds.has(attachment.spaceId)
        );

        if (projectAttachments.length === 0) {
            console.log('[reindexUploadedAttachments] No uploaded attachments to reindex');
            return;
        }

        console.log(
            `[reindexUploadedAttachments] Checking ${projectAttachments.length} uploaded attachments for indexing`
        );

        const searchService = SearchService.get(userId);
        const result: { success: boolean; indexed: number } = yield call(
            [searchService, searchService.reindexUploadedAttachments],
            projectAttachments
        );

        console.log('[reindexUploadedAttachments] Result:', result);
    } catch (error) {
        console.error('[reindexUploadedAttachments] Failed:', error);
    }
}

export function* unloadRedux(): SagaIterator {
    yield put(deleteAllSpaces());
    yield put(deleteAllConversations());
    yield put(deleteAllMessages());
    yield put(deleteAllAttachments());
    yield put(deleteAllIdMaps());
}

export function* reloadRedux({}: { payload: any }): SagaIterator<any> {
    console.log('Saga triggered: reloadRedux');
    yield call(unloadRedux);
    yield call(loadReduxFromIdb);
}

export function* pushDirtyResources(): SagaIterator {
    console.log('Saga triggered: pushDirtyResources');
    const dbApi: DbApi = yield getContext('dbApi');

    const unsynced: UnsyncedMaps = yield call([dbApi, dbApi.findUnsyncedResources]);
    const { unsyncedMessages, unsyncedConversations, unsyncedSpaces, unsyncedAttachments } = unsynced;

    // todo: better if we build a graph and try to regroup spaces/convs/messages together

    const allEmpty =
        mapEmpty(unsyncedSpaces) &&
        mapEmpty(unsyncedConversations) &&
        mapEmpty(unsyncedMessages) &&
        mapEmpty(unsyncedAttachments);
    if (allEmpty) {
        console.log('pushDirtyResources: found no resource that needs sync.');
        return;
    }

    const mapLengths = {
        spaces: mapLength(unsyncedSpaces),
        conversations: mapLength(unsyncedConversations),
        messages: mapLength(unsyncedMessages),
        attachments: mapLength(unsyncedAttachments),
    };
    console.log('pushDirtyResources: found resources that needs sync: ', mapLengths);

    for (const id of mapIds(unsyncedSpaces)) {
        console.log(`Requesting push of space ${id} in background`);
        yield put(pushSpaceRequest({ id, priority: 'background' }));
    }

    for (const id of mapIds(unsyncedConversations)) {
        console.log(`Requesting push of conversation ${id} in background`);
        yield put(pushConversationRequest({ id, priority: 'background' }));
    }

    for (const id of mapIds(unsyncedMessages)) {
        console.log(`Requesting push of message ${id} in background`);
        yield put(pushMessageRequest({ id, priority: 'background' }));
    }

    for (const id of mapIds(unsyncedAttachments)) {
        console.log(`Requesting push of attachment ${id} in background`);
        yield put(pushAttachmentRequest({ id, priority: 'background' }));
    }
}

export function* initAppSaga({}: { payload: any }): SagaIterator<any> {
    console.log('Saga triggered: initAppSaga');
    yield call(loadReduxFromIdb);
    yield put(pullSpacesRequest());
    yield spawn(pushDirtyResources);
}

export function* rootSaga(opts?: { crashIfErrors: boolean }) {
    console.log('in rootSaga');
    const crashIfErrors = opts?.crashIfErrors ?? false;

    // prettier-ignore
    // @formatter:off
    const watchers = ([
        function*() { yield takeEvery(addIdMapEntry, considerSavingIdMapToIdb) },

        function*() { yield takeEvery(pushSpaceRequest, noRaceSameId(pushSpace))},
        function*() { yield takeEvery(pushSpaceSuccess, logPushSpaceSuccess)},
        function*() { yield takeEvery(pushSpaceFailure, logPushSpaceFailure)},
        function*() { yield takeEvery(pushSpaceNoop, logPushSpaceNoop)},
        function*() { yield takeEvery(pushSpaceNeedsRetry, retryPushSpace)},
        function*() { yield takeEvery(pullSpaceRequest, dedupSameId(pullSpace))},
        function*() { yield takeEvery(pullSpaceSuccess, processPullSpaceResult)},
        function*() { yield takeEvery(pullSpaceFailure, logPullSpaceFailure)},
        function*() { yield takeLeading(pullSpacesRequest, pullSpaces)},
        function*() { yield takeEvery(pullSpacesPageResponse, processPullSpacesPage)},
        function*() { yield takeEvery(pullSpacesSuccess, logPullSpacesSuccess)},
        function*() { yield takeEvery(pullSpacesFailure, logPullSpacesFailure)},
        function*() { yield takeEvery(pullSpaceRequest, pullSpace)},
        function*() { yield takeEvery(pullSpaceSuccess, processPullSpaceResult)},
        function*() { yield takeEvery(locallyDeleteSpaceFromLocalRequest, softDeleteSpaceFromLocal)},
        function*() { yield takeEvery(locallyDeleteSpaceFromRemoteRequest, softDeleteSpaceFromRemote)},
        function*() { yield takeEvery(locallyRefreshSpaceFromRemoteRequest, refreshSpaceFromRemote)},
        function*() { yield takeEvery(deleteAllSpacesRequest, handleDeleteAllSpaces)},
        function*() { yield takeEvery(deleteAllSpacesSuccess, logDeleteAllSpacesSuccess)},
        function*() { yield takeEvery(deleteAllSpacesFailure, logDeleteAllSpacesFailure)},

        function*() { yield takeEvery(pushConversationRequest, noRaceSameId(pushConversation))},
        function*() { yield takeEvery(pushConversationSuccess, logPushConversationSuccess)},
        function*() { yield takeEvery(pushConversationFailure, logPushConversationFailure)},
        function*() { yield takeEvery(pushConversationNeedsRetry, retryPushConversation)},
        function*() { yield takeEvery(pullConversationRequest, dedupSameId(pullConversation))},
        function*() { yield takeEvery(pullConversationSuccess, processPullConversationResult)},
        function*() { yield takeEvery(pullConversationFailure, logPullConversationFailure)},
        function*() { yield takeEvery(locallyDeleteConversationFromLocalRequest, softDeleteConversationFromLocal)},
        function*() { yield takeEvery(locallyDeleteConversationFromRemoteRequest, softDeleteConversationFromRemote)},
        function*() { yield takeEvery(locallyRefreshConversationFromRemoteRequest, refreshConversationFromRemote)},

        function*() { yield takeEvery(pushMessageRequest, noRaceSameId(pushMessage))},
        function*() { yield takeEvery(pushMessageSuccess, logPushMessageSuccess)},
        function*() { yield takeEvery(pushMessageFailure, logPushMessageFailure)},
        function*() { yield takeEvery(pushMessageNoop, logPushMessageNoop)},
        function*() { yield takeEvery(pushMessageNeedsRetry, retryPushMessage)},
        function*() { yield takeEvery(pullMessageRequest, dedupSameId(pullMessage))},
        function*() { yield takeEvery(pullMessageSuccess, processPullMessageResult)},
        function*() { yield takeEvery(pullMessageFailure, logPullMessageFailure)},
        function*() { yield takeEvery(locallyRefreshMessageFromRemoteRequest, refreshMessageFromRemote)},

        function*() { yield takeEvery(pushAttachmentRequest, noRaceSameId(pushAttachment))},
        function*() { yield takeEvery(pushAttachmentSuccess, logPushAttachmentSuccess)},
        function*() { yield takeEvery(pushAttachmentFailure, logPushAttachmentFailure)},
        function*() { yield takeEvery(pushAttachmentNoop, logPushAttachmentNoop)},
        function*() { yield takeEvery(pushAttachmentNeedsRetry, retryPushAttachment)},
        function*() { yield takeEvery(pullAttachmentRequest, dedupSameId(pullAttachment))},
        function*() { yield takeEvery(pullAttachmentSuccess, processPullAttachmentResult)},
        function*() { yield takeEvery(pullAttachmentFailure, logPullAttachmentFailure)},
        function*() { yield takeEvery(locallyDeleteAttachmentFromLocalRequest, softDeleteAttachmentFromLocal)},
        function*() { yield takeEvery(locallyDeleteAttachmentFromRemoteRequest, softDeleteAttachmentFromRemote)},
        function*() { yield takeEvery(locallyRefreshFilledAttachmentFromRemoteRequest, refreshFilledAttachmentFromRemote)},
        function*() { yield takeEvery(locallyRefreshShallowAttachmentFromRemoteRequest, refreshShallowAttachmentFromRemote)},
        function*() { yield takeEvery(indexAttachmentRequest, indexAttachment)},
        function*() { yield takeEvery(unindexAttachmentRequest, unindexAttachment)},

        function*() { yield takeEvery(addMasterKey, initAppSaga)},
        function*() { yield takeEvery(reloadReduxRequest, reloadRedux) },
        function*() { yield takeEvery(unloadReduxRequest, unloadRedux) },
    ]);
    // @formatter:on

    // @ts-ignore
    const rootWatcher = yield all(
        watchers.map((w) =>
            spawn(function* wrappedWatcher() {
                while (true) {
                    try {
                        yield call(w);
                    } catch (err) {
                        if (crashIfErrors) throw err;
                        console.error(`Watcher crashed, restarting`, err);
                    }
                }
            })
        )
    );

    yield take(stopRootSaga);
    console.log('Stopping root saga');
    yield cancel(rootWatcher);
}
