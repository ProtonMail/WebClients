import type { Dispatch } from '@reduxjs/toolkit';
import type { SagaIterator } from 'redux-saga';
import { runSaga } from 'redux-saga';
import { all, call, getContext, put, select } from 'redux-saga/effects';

import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import type { DbApi } from '../../indexedDb/db';
import type { LumoApi } from '../../remote/api';
import type { GetConversationRemote, GetSpaceRemote, RemoteId, RemoteMessage } from '../../remote/types';
import { deserializeMessage } from '../../serialization';
import type {
    Conversation,
    ConversationId,
    Message,
    SerializedConversation,
    SerializedMessage,
    SerializedSpace,
    Space,
} from '../../types';
import { ConversationStatus, cleanMessage, getSpaceDek, isEmptyMessagePriv } from '../../types';
import {
    selectConversationById,
    selectMessageById,
    selectMessagesByConversationId,
    selectRemoteIdFromLocal,
    selectSpaceById,
} from '../selectors';
import type { MessageMap } from '../slices/core/messages';
import { addMessage } from '../slices/core/messages';
import type { LumoState } from '../store';
import type { LumoThunkArguments } from '../thunk';
import { refreshConversationFromRemote } from './conversations';
import { refreshMessageFromRemote } from './messages';

const FETCH_MESSAGES_CONCURRENCY = 8;

class UnverifiedConversationOriginError extends Error {}

/** The user can choose to export available messages when full coverage cannot be established. */
export class LocalExportAvailableError extends Error {}

/** Resource GETs surface native fetch errors and plain HTTP errors alongside shared API errors. */
function isExportConnectionIssue(error: unknown): boolean {
    if (getIsConnectionIssue(error)) {
        return true;
    }
    if (!(error instanceof Error)) {
        return false;
    }
    if (
        error instanceof TypeError &&
        /^(failed to fetch|load failed|networkerror when attempting to fetch resource\.?|fetch failed)$/i.test(
            error.message
        )
    ) {
        return true;
    }
    const status = /^HTTP error: got (\d{3})$/.exec(error.message)?.[1];
    return status !== undefined && getIsConnectionIssue({ status: Number(status) });
}

type ConversationSnapshot = {
    conversation: Conversation;
    messages: MessageMap;
};

/**
 * Loads one listed message into Redux. Reuses its decrypted body when available, decrypts cached ciphertext when
 * needed, and falls back to the server copy when the cached body is missing or unreadable.
 * Throws if the message is unavailable or was deleted locally.
 */
function* loadMessage(message: RemoteMessage, space: Space): SagaIterator<void> {
    const { id, conversationId } = message;
    const dbApi: DbApi = yield getContext('dbApi');
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const stored: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], id);

    if (stored?.deleted) {
        throw new Error('Conversation message was deleted locally');
    }
    const local: Message | undefined = yield select(selectMessageById(id));
    if (local?.placeholder) {
        throw new Error('Conversation message is still generating');
    }
    if (local && !isEmptyMessagePriv(local)) {
        return;
    }
    if (stored?.encrypted) {
        // The cache can be ahead of Redux, which may only contain the message's public fields.
        const key = yield call(getSpaceDek, space);
        const decrypted: Message | null = yield call(deserializeMessage, stored, key);
        if (decrypted) {
            const parent: Conversation | undefined = yield select(selectConversationById(conversationId));
            if (parent?.spaceId !== space.id || !(yield select(selectSpaceById(space.id)))) {
                throw new Error('Conversation is unavailable locally');
            }
            const latest: Message | undefined = yield select(selectMessageById(id));
            if (!latest || (!latest.placeholder && isEmptyMessagePriv(latest))) {
                yield put(addMessage(cleanMessage(decrypted)));
            }
            return;
        }
    }

    const full: RemoteMessage | null = message.encrypted
        ? message
        : yield call(
              [lumoApi, lumoApi.getMessage],
              message.remoteId,
              conversationId,
              message.parentId,
              message.remoteConversationId
          );
    if (!full || full.deleted || !full.encrypted || full.id !== id || full.conversationId !== conversationId) {
        throw new Error('Conversation message is unavailable');
    }
    const hydrated: Message | undefined = yield call(refreshMessageFromRemote, { payload: full }, space.id);
    if (!hydrated) {
        throw new Error('Conversation message could not be decrypted or loaded');
    }
}

/**
 * Refreshes a synced conversation and loads its message bodies in bounded batches for export or move.
 * Resolves after verifying that every active message in the server's list has a non-placeholder entry in Redux.
 * Throws if the conversation disappears or any required message cannot be loaded.
 */
export function* loadSyncedConversation(
    conversation: Conversation,
    remoteId: RemoteId
): SagaIterator<ConversationSnapshot> {
    const { id, spaceId } = conversation;
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remote: GetConversationRemote | null = yield call([lumoApi, lumoApi.getConversation], remoteId, spaceId);
    if (!remote || remote.conversation.deleted || remote.conversation.id !== id) {
        throw new Error('Conversation is unavailable');
    }
    const space: Space | undefined = yield select(selectSpaceById(spaceId));
    if (!space || !(yield select(selectConversationById(id)))) {
        throw new Error('Conversation is unavailable locally');
    }
    yield call(refreshConversationFromRemote, { payload: remote.conversation });
    const activeMessages = remote.messages.filter((message) => !message.deleted);
    for (let i = 0; i < activeMessages.length; i += FETCH_MESSAGES_CONCURRENCY) {
        yield all(
            activeMessages.slice(i, i + FETCH_MESSAGES_CONCURRENCY).map((message) => call(loadMessage, message, space))
        );
    }

    const messages: MessageMap = yield select(selectMessagesByConversationId(id));
    const listedMessages = new Map(remote.messages.map((message) => [message.id, message]));
    for (const { id: messageId } of activeMessages) {
        if (!messages[messageId] || messages[messageId].placeholder) {
            throw new Error('Conversation message could not be loaded');
        }
    }
    // Drop server-deleted messages that are still cached. Keep complete local replies that may still be uploading.
    const snapshot = Object.fromEntries(
        Object.entries(messages).filter(([messageId, message]) => {
            const listed = listedMessages.get(messageId);
            return listed ? !listed.deleted : !message.placeholder && !isEmptyMessagePriv(message);
        })
    );
    const refreshed: Conversation | undefined = yield select(selectConversationById(id));
    if (refreshed?.spaceId !== spaceId || !(yield select(selectSpaceById(spaceId)))) {
        throw new Error('Conversation is unavailable locally');
    }
    return { conversation: refreshed, messages: snapshot };
}

/**
 * Resolves the server ID from Redux or IndexedDB. Returns undefined for a local-only chat and throws when sync state or
 * an unavailable parent space prevents verifying that the chat is local-only.
 */
export function* resolveConversationRemoteId({ id, spaceId }: Conversation): SagaIterator<RemoteId | undefined> {
    const dbApi: DbApi = yield getContext('dbApi');
    const lumoApi: LumoApi = yield getContext('lumoApi');
    const remoteId: RemoteId | undefined =
        (yield select(selectRemoteIdFromLocal('conversation', id))) ??
        (yield call([dbApi, dbApi.getRemoteIdFromLocalId], 'conversation', id));
    if (remoteId) {
        return remoteId;
    }

    // A clean persisted record is evidence of a prior sync even if its ID mapping is missing.
    const stored: SerializedConversation | undefined = yield call([dbApi, dbApi.getConversationById], id);
    if (stored && (stored.deleted || !stored.dirty)) {
        throw new Error('Previously synced conversation is missing its server ID');
    }

    // A dirty conversation can also be an edit to a previously synced chat. Check its space
    // before assuming it only exists on this device.
    const remoteSpaceId: RemoteId | undefined =
        (yield select(selectRemoteIdFromLocal('space', spaceId))) ??
        (yield call([dbApi, dbApi.getRemoteIdFromLocalId], 'space', spaceId));
    if (remoteSpaceId) {
        const remoteSpace: GetSpaceRemote | null = yield call([lumoApi, lumoApi.getSpace], remoteSpaceId);
        if (
            !remoteSpace ||
            remoteSpace.space.id !== spaceId ||
            remoteSpace.space.deleted ||
            [...remoteSpace.conversations, ...remoteSpace.deletedConversations].some((chat) => chat.id === id)
        ) {
            throw new Error('Cannot verify that the conversation exists only on this device');
        }
    } else {
        const storedSpace: SerializedSpace | undefined = yield call([dbApi, dbApi.getSpaceById], spaceId);
        // Without either mapping, a persisted record may belong to a synced space with pending local edits.
        if (storedSpace?.deleted) {
            throw new Error('Conversation space was deleted locally');
        }
        if (stored || storedSpace) {
            throw new UnverifiedConversationOriginError(
                'Cannot verify that the conversation exists only on this device'
            );
        }
    }
    // A new in-memory chat can finish uploading while we check IndexedDB or its remote space.
    return yield select(selectRemoteIdFromLocal('conversation', id));
}

/** Reads the device cache without writing into Redux or changing persisted message bodies. */
function* loadCachedExport(conversation: Conversation, requireComplete = false): SagaIterator<ConversationSnapshot> {
    const { id, spaceId } = conversation;
    const dbApi: DbApi = yield getContext('dbApi');
    const space: Space | undefined = yield select(selectSpaceById(spaceId));
    const stored: SerializedConversation | undefined = yield call(dbApi.getConversationById, id);
    const storedSpace: SerializedSpace | undefined = yield call(dbApi.getSpaceById, spaceId);
    if (!space || stored?.deleted || storedSpace?.deleted) {
        throw new Error('Conversation is unavailable locally');
    }
    const rows: SerializedMessage[] = yield call(dbApi.getMessagesByConversationId, id);
    const local: MessageMap = yield select(selectMessagesByConversationId(id));
    const rowsById = new Map(rows.map((message) => [message.id, message]));
    const ids = new Set([...rowsById.keys(), ...Object.keys(local)]);
    const messages: MessageMap = {};
    let key: Awaited<ReturnType<typeof getSpaceDek>> | undefined;
    for (const messageId of ids) {
        const row = rowsById.get(messageId);
        if (row?.deleted) {
            continue;
        }
        const message = local[messageId];
        if (message?.placeholder) {
            throw new Error('Conversation is not ready to export');
        }
        if (message && !isEmptyMessagePriv(message)) {
            messages[messageId] = message;
        } else if (row?.encrypted) {
            if (!key) {
                const spaceKey: Awaited<ReturnType<typeof getSpaceDek>> = yield call(getSpaceDek, space);
                key = spaceKey;
            }
            const decrypted: Message | null = yield call(deserializeMessage, row, key);
            if (decrypted) {
                messages[messageId] = cleanMessage(decrypted);
            }
        }
        if (requireComplete && !messages[messageId]) {
            throw new LocalExportAvailableError('The full conversation is not available on this device');
        }
    }
    const refreshed: Conversation | undefined = yield select(selectConversationById(id));
    if (
        refreshed?.spaceId !== spaceId ||
        refreshed.status === ConversationStatus.GENERATING ||
        !(yield select(selectSpaceById(spaceId)))
    ) {
        throw new Error('Conversation is not ready to export');
    }
    return { conversation: refreshed, messages };
}

/**
 * Prepares a verified transcript, or reads available messages after the user explicitly chooses that option.
 * Guest and ghost chats are local by design and use their in-memory messages.
 */
function* loadExportSnapshot(
    id: ConversationId,
    isGuest: boolean,
    allowUnverified: boolean
): SagaIterator<ConversationSnapshot> {
    const conversation: Conversation | undefined = yield select(selectConversationById(id));
    if (!conversation || conversation.status === ConversationStatus.GENERATING) {
        throw new Error('Conversation is not ready to export');
    }

    if (!isGuest && !conversation.ghost) {
        if (allowUnverified) {
            return yield call(loadCachedExport, conversation);
        }
        try {
            const remoteId: RemoteId | undefined = yield call(resolveConversationRemoteId, conversation);
            if (!remoteId) {
                return yield call(loadCachedExport, conversation, true);
            }
            const snapshot: ConversationSnapshot = yield call(loadSyncedConversation, conversation, remoteId);
            if (snapshot.conversation.status === ConversationStatus.GENERATING) {
                throw new Error('Conversation is not ready to export');
            }
            return snapshot;
        } catch (error) {
            if (error instanceof UnverifiedConversationOriginError || isExportConnectionIssue(error)) {
                throw new LocalExportAvailableError('The full conversation could not be verified', { cause: error });
            }
            throw error;
        }
    }

    const refreshed: Conversation | undefined = yield select(selectConversationById(id));
    if (!refreshed || refreshed.status === ConversationStatus.GENERATING) {
        throw new Error('Conversation is not ready to export');
    }
    const messages: MessageMap = yield select(selectMessagesByConversationId(id));
    return { conversation: refreshed, messages };
}

/**
 * Returns a thunk that lets the export dialog await the snapshot saga.
 * The returned promise rejects on load failure so the dialog can show a retryable error.
 */
export const prepareConversationExport =
    (id: ConversationId, isGuest: boolean, signal?: AbortSignal, allowUnverified = false) =>
    async (
        dispatch: Dispatch,
        getState: () => LumoState,
        { dbApi, lumoApi }: LumoThunkArguments
    ): Promise<ConversationSnapshot> => {
        signal?.throwIfAborted();
        const task = runSaga(
            { dispatch, getState, context: { dbApi, lumoApi }, onError: () => {} },
            loadExportSnapshot,
            id,
            isGuest,
            allowUnverified
        );
        const cancel = () => task.cancel();
        signal?.addEventListener('abort', cancel);
        if (signal?.aborted) {
            cancel();
        }
        try {
            const snapshot = await task.toPromise();
            signal?.throwIfAborted();
            return snapshot;
        } finally {
            signal?.removeEventListener('abort', cancel);
        }
    };
