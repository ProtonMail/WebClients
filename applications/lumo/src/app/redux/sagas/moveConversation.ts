import type { Action, PayloadAction } from '@reduxjs/toolkit';
import isEqual from 'lodash/isEqual';
import type { SagaIterator } from 'redux-saga';
import type { Channel } from 'redux-saga';
import { buffers } from 'redux-saga';
import { actionChannel, all, call, getContext, put, select, take } from 'redux-saga/effects';

import { MAX_ASSETS_PER_SPACE, MAX_CONVERSATIONS_PER_SPACE } from '../../constants/limits';
import type { DbApi } from '../../indexedDb/db';
import type { LumoApi } from '../../remote/api';
import type {
    GetConversationRemote,
    GetSpaceRemote,
    RemoteDeletedAttachment,
    RemoteFilledAttachment,
    RemoteMessage,
} from '../../remote/types';
import { attachmentDataCache } from '../../services/attachmentDataCache';
import type {
    Attachment,
    AttachmentId,
    Conversation,
    ConversationId,
    Message,
    MessageId,
    SerializedAttachment,
    SerializedMessage,
    ShallowAttachment,
    Space,
} from '../../types';
import { ConversationStatus, SpaceType, cleanAttachment, cleanConversation, cleanMessage } from '../../types';
import {
    selectAttachmentById,
    selectAttachmentsBySpaceId,
    selectConversationById,
    selectConversationsBySpaceId,
    selectMessagesByConversationId,
    selectSpaceById,
} from '../selectors';
import {
    addAttachment,
    indexAttachmentRequest,
    locallyDeleteAttachmentFromLocalRequest,
    newAttachmentId,
    pushAttachmentFailure,
    pushAttachmentNoop,
    pushAttachmentRequest,
    pushAttachmentSuccess,
} from '../slices/core/attachments';
import {
    type MoveConversationToSpaceFailure,
    type MoveConversationToSpaceRequest,
    addConversation,
    locallyDeleteConversationFromLocalRequest,
    moveConversationToSpaceFailure,
    moveConversationToSpaceProgress,
    moveConversationToSpaceSuccess,
    newConversationId,
    pushConversationFailure,
    pushConversationNoop,
    pushConversationRequest,
    pushConversationSuccess,
} from '../slices/core/conversations';
import { addIdMapEntry } from '../slices/core/idmap';
import {
    addMessage,
    deleteMessage,
    newMessageId,
    pushMessageFailure,
    pushMessageNoop,
    pushMessageRequest,
    pushMessageSuccess,
} from '../slices/core/messages';
import type { LumoState } from '../store';
import { hasPendingArtifactSync } from './artifactAssetSyncState';
import {
    deserializeAttachmentSaga,
    refreshFilledAttachmentFromRemote,
    softDeleteAttachmentFromLocal,
} from './attachments';
import { refreshConversationFromRemote, softDeleteConversationFromLocal } from './conversations';
import { refreshMessageFromRemote } from './messages';
import { softDeleteSpaceFromLocal } from './spaces';

class MoveConversationError extends Error {
    reason?: MoveConversationToSpaceFailure['reason'];

    constructor(message: string, reason?: MoveConversationToSpaceFailure['reason']) {
        super(message);
        this.reason = reason;
    }
}

type PushKind = 'conversation' | 'message' | 'attachment';

// Conversations being moved right now, so a double click can't create two copies.
const inFlight = new Set<ConversationId>();

const pushKey = (kind: PushKind, id: string) => `${kind}:${id}`;

/** Maps push outcome actions to the resource they refer to. Retries (`needsRetry`) are intentionally ignored. */
function getPushOutcome(action: Action): { key: string; ok: boolean; error?: string } | undefined {
    const { type, payload } = action as PayloadAction<{ id: string; error?: string }>;
    switch (type) {
        case pushConversationSuccess.type:
        case pushConversationNoop.type:
            return { key: pushKey('conversation', payload.id), ok: true };
        case pushConversationFailure.type:
            return { key: pushKey('conversation', payload.id), ok: false, error: payload.error };
        case pushMessageSuccess.type:
        case pushMessageNoop.type:
            return { key: pushKey('message', payload.id), ok: true };
        case pushMessageFailure.type:
            return { key: pushKey('message', payload.id), ok: false, error: payload.error };
        case pushAttachmentSuccess.type:
        case pushAttachmentNoop.type:
            return { key: pushKey('attachment', payload.id), ok: true };
        case pushAttachmentFailure.type:
            return { key: pushKey('attachment', payload.id), ok: false, error: payload.error };
        default:
            return undefined;
    }
}

/**
 * What the server knows about the source space's files, loaded at most once per move. `GET conversation` and the
 * space list don't carry assets, so a file that another device just created (an artifact pointer refreshed from
 * the server, for example) can be unknown here until the space itself is fetched.
 */
type AssetDiscovery = { loaded: boolean; remoteIds: Map<AttachmentId, string>; deleted: Set<AttachmentId> };

const newAssetDiscovery = (): AssetDiscovery => ({ loaded: false, remoteIds: new Map(), deleted: new Set() });

function* discoverRemoteAsset(
    id: AttachmentId,
    spaceId: string,
    discovery: AssetDiscovery
): SagaIterator<{ remoteId?: string; deleted: boolean }> {
    if (!discovery.loaded) {
        const remoteSpaceId: string | undefined = yield select(
            (s: LumoState) => s.idmap?.local2remote?.space?.[spaceId]
        );
        if (remoteSpaceId) {
            const lumoApi: LumoApi = yield getContext('lumoApi');
            let remoteSpace: GetSpaceRemote | null;
            try {
                remoteSpace = yield call([lumoApi, lumoApi.getSpace], remoteSpaceId);
            } catch (e) {
                console.error('moveConversation: cannot fetch the project to look up its files', e);
                throw new MoveConversationError('cannot look up the files of the chat', 'unavailable');
            }
            remoteSpace?.assets.forEach((asset) => discovery.remoteIds.set(asset.id, asset.remoteId));
            remoteSpace?.deletedAssets.forEach((asset) => discovery.deleted.add(asset.id));
        }
        discovery.loaded = true;
    }

    const remoteId = discovery.remoteIds.get(id);
    if (remoteId) {
        // Record the mapping, as loading the space normally would, so the download below can use it.
        yield put(addIdMapEntry({ type: 'attachment', localId: id, remoteId, saveToIdb: true }));
    }
    return { remoteId, deleted: discovery.deleted.has(id) };
}

/**
 * Finds the full attachment (with binary data in `attachmentDataCache`), loading it from IndexedDB when needed
 * and from the server when it only exists remotely.
 *
 * Returns undefined only when the file is confirmed gone: soft-deleted locally, or deleted on the server.
 * Anything else that can't be turned into a local copy throws `unavailable`, so the move is aborted instead of
 * leaving a reference to a file whose key is about to be deleted.
 */
function* resolveFullAttachment(
    id: AttachmentId,
    spaceId: string,
    discovery: AssetDiscovery
): SagaIterator<Attachment | undefined> {
    const inRedux: Attachment | undefined = yield select(selectAttachmentById(id));
    if (inRedux && attachmentDataCache.hasData(id)) {
        return inRedux;
    }

    const dbApi: DbApi = yield getContext('dbApi');
    const idb: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], id);
    if (idb && idb.encrypted && !idb.deleted) {
        // Populates attachmentDataCache as a side effect.
        return yield call(deserializeAttachmentSaga, idb);
    }
    if (idb?.deleted) {
        return undefined;
    }

    if (inRedux && inRedux.markdown !== undefined) {
        return inRedux;
    }

    let remoteId: string | undefined = yield select((s: LumoState) => s.idmap?.local2remote?.attachment?.[id]);
    if (!remoteId) {
        const found: { remoteId?: string; deleted: boolean } = yield call(discoverRemoteAsset, id, spaceId, discovery);
        if (found.deleted) {
            return undefined;
        }
        remoteId = found.remoteId;
    }
    if (!remoteId) {
        throw new MoveConversationError(`attachment ${id} could not be located`, 'unavailable');
    }

    const lumoApi: LumoApi = yield getContext('lumoApi');
    let remote: RemoteFilledAttachment | RemoteDeletedAttachment | null;
    try {
        remote = yield call([lumoApi, lumoApi.getAttachment], remoteId, spaceId);
    } catch (e) {
        console.error(`moveConversation: cannot fetch attachment ${id}`, e);
        throw new MoveConversationError(`attachment ${id} could not be fetched`, 'unavailable');
    }
    if (!remote) {
        throw new MoveConversationError(`attachment ${id} is not available`, 'unavailable');
    }
    if (remote.deleted) {
        return undefined;
    }

    // Awaited: stores the file in Redux and IndexedDB.
    yield call(refreshFilledAttachmentFromRemote, { payload: remote });

    const stored: SerializedAttachment | undefined = yield call([dbApi, dbApi.getAttachmentById], id);
    if (stored && stored.encrypted && !stored.deleted) {
        return yield call(deserializeAttachmentSaga, stored);
    }
    const refreshed: Attachment | undefined = yield select(selectAttachmentById(id));
    if (refreshed && (attachmentDataCache.hasData(id) || refreshed.markdown !== undefined)) {
        return refreshed;
    }
    throw new MoveConversationError(`attachment ${id} could not be loaded`, 'unavailable');
}

// Full messages fetched in parallel while completing a conversation before a move.
const FETCH_MESSAGES_CONCURRENCY = 8;

/**
 * Moving copies what is on this device and then deletes the original, so the local copy must be complete.
 * A chat that was never opened here only has what the space-list pull brought: no messages, or shallow ones
 * (no payload). Those are fetched when a chat is opened, so do the same here and wait for it. Throws when
 * completeness can't be confirmed, so the move is aborted before anything is created or deleted.
 *
 * Chats that were never pushed have no remote counterpart and are complete locally.
 */
function* ensureConversationFullyLoaded(
    conversation: Conversation,
    request: MoveConversationToSpaceRequest
): SagaIterator<void> {
    const remoteConversationId: string | undefined = yield select(
        (s: LumoState) => s.idmap?.local2remote?.conversation?.[conversation.id]
    );
    if (!remoteConversationId) {
        return;
    }

    // Fetching is where a slow connection hurts, so let the user know what is going on.
    yield put(moveConversationToSpaceProgress({ ...request, stage: 'loading' }));

    const lumoApi: LumoApi = yield getContext('lumoApi');
    const dbApi: DbApi = yield getContext('dbApi');

    let remote: GetConversationRemote | null;
    try {
        remote = yield call([lumoApi, lumoApi.getConversation], remoteConversationId, conversation.spaceId);
    } catch (e) {
        console.error('moveConversation: cannot fetch the conversation', e);
        throw new MoveConversationError('cannot fetch the conversation', 'unavailable');
    }
    if (!remote || remote.conversation.deleted) {
        throw new MoveConversationError('conversation is not available remotely', 'unavailable');
    }

    // The response carries the conversation's current metadata (title, `artifactAssets`...), which may be newer than
    // Redux. Take it in before anything is copied: the copy is built from, and later compared with, what Redux holds.
    try {
        yield call(refreshConversationFromRemote, { payload: remote.conversation });
    } catch (e) {
        console.error('moveConversation: cannot refresh the conversation', e);
        throw new MoveConversationError('cannot refresh the conversation', 'unavailable');
    }

    const remoteMessages = remote.messages.filter((m) => !m.deleted);

    const isFilledLocally = function* (messageId: MessageId): SagaIterator<boolean> {
        const idbMessage: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], messageId);
        return Boolean(idbMessage?.encrypted);
    };

    for (let i = 0; i < remoteMessages.length; i += FETCH_MESSAGES_CONCURRENCY) {
        const chunk = remoteMessages.slice(i, i + FETCH_MESSAGES_CONCURRENCY);
        yield all(
            chunk.map((shallow) =>
                call(function* (): SagaIterator<void> {
                    if (yield call(isFilledLocally, shallow.id)) {
                        return;
                    }
                    let full: RemoteMessage | null;
                    try {
                        full = shallow.encrypted
                            ? shallow
                            : yield call(
                                  [lumoApi, lumoApi.getMessage],
                                  shallow.remoteId,
                                  shallow.conversationId,
                                  shallow.parentId,
                                  shallow.remoteConversationId
                              );
                    } catch (e) {
                        console.error(`moveConversation: cannot fetch message ${shallow.id}`, e);
                        throw new MoveConversationError(`message ${shallow.id} could not be fetched`, 'unavailable');
                    }
                    if (!full || !full.encrypted) {
                        throw new MoveConversationError(`message ${shallow.id} is not available`, 'unavailable');
                    }
                    // Awaited: stores the message in Redux and IndexedDB and pulls its attachments.
                    yield call(refreshMessageFromRemote, { payload: full });
                })
            )
        );
    }

    // Confirm instead of assuming: every remote message must now be complete on this device.
    const inRedux: Record<MessageId, Message> = yield select(selectMessagesByConversationId(conversation.id));
    for (const { id } of remoteMessages) {
        const filled: boolean = yield call(isFilledLocally, id);
        if (!filled || !inRedux[id]) {
            throw new MoveConversationError(`message ${id} could not be loaded`, 'unavailable');
        }
    }
}

function remapShallowAttachment(
    attachment: ShallowAttachment,
    idMap: Map<AttachmentId, AttachmentId>,
    targetSpaceId: string
): ShallowAttachment {
    const newId = idMap.get(attachment.id);
    return newId ? { ...attachment, id: newId, spaceId: targetSpaceId } : attachment;
}

function* waitForPushes(channel: Channel<Action>, pending: Set<string>): SagaIterator<void> {
    while (pending.size > 0) {
        const action: Action = yield take(channel);
        const outcome = getPushOutcome(action);
        if (!outcome || !pending.has(outcome.key)) {
            continue;
        }
        if (!outcome.ok) {
            throw new MoveConversationError(outcome.error ?? `failed to sync ${outcome.key}`);
        }
        pending.delete(outcome.key);
    }
}

type Created = {
    conversationId?: ConversationId;
    messageIds: MessageId[];
    attachmentIds: AttachmentId[];
};

type CopyResult = {
    newConversationId: ConversationId;
    /** Ids of the original attachments that were copied. */
    copiedAttachmentIds: AttachmentId[];
};

/** What the copy carries over from the conversation itself, apart from ids and timestamps. */
const getTransferredMetadata = (conversation: Conversation) => ({
    title: conversation.title,
    starred: Boolean(conversation.starred),
    agentId: conversation.agentId,
    artifactCreation: conversation.artifactCreation,
    artifactAssets: conversation.artifactAssets ?? {},
});

const ATTACHMENT_URL = /\(attachment:([^)\s]+)\)/g;

/** Generated images are embedded in message text as `attachment:<id>` URLs, which the renderer resolves directly. */
const remapAttachmentUrls = (text: string, idMap: Map<AttachmentId, AttachmentId>): string =>
    text.replace(ATTACHMENT_URL, (match, id: string) => {
        const newId = idMap.get(id);
        return newId ? `(attachment:${newId})` : match;
    });

function* copyConversation(request: MoveConversationToSpaceRequest, created: Created): SagaIterator<CopyResult> {
    const { conversationId, targetSpaceId } = request;
    let conversation: Conversation | undefined = yield select(selectConversationById(conversationId));
    const targetSpace: Space | undefined = yield select(selectSpaceById(targetSpaceId));

    if (!conversation || !targetSpace) {
        throw new MoveConversationError('conversation or target project not found', 'unavailable');
    }
    if (targetSpace.spaceType !== SpaceType.Project) {
        throw new MoveConversationError('target space is not a project', 'unsupported');
    }
    if (conversation.spaceId === targetSpaceId) {
        throw new MoveConversationError('conversation is already in this project', 'unsupported');
    }
    // Private projects are hidden from searches done in other chats: never expose a private chat by moving it out.
    const sourceSpace: Space | undefined = yield select(selectSpaceById(conversation.spaceId));
    if (
        sourceSpace?.spaceType === SpaceType.Project &&
        sourceSpace.isPrivate &&
        targetSpace.spaceType === SpaceType.Project &&
        !targetSpace.isPrivate
    ) {
        throw new MoveConversationError('cannot move a chat out of a private project', 'privacy');
    }
    if (conversation.ghost || conversation.scheduleRun) {
        throw new MoveConversationError('this conversation cannot be moved', 'unsupported');
    }
    if (conversation.status === ConversationStatus.GENERATING) {
        throw new MoveConversationError('conversation is generating a response', 'busy');
    }

    // A generated file still uploading adds an `artifactAssets` pointer when it lands, after the copy was taken.
    if (hasPendingArtifactSync(conversationId)) {
        throw new MoveConversationError('a generated file is still being saved', 'busy');
    }

    // The copy is only as complete as what is on this device, so make sure all of it is here first.
    yield call(ensureConversationFullyLoaded, conversation, request);

    // Loading can take a while: copy the conversation as it is now, not as it was before.
    const refreshed: Conversation | undefined = yield select(selectConversationById(conversationId));
    if (!refreshed) {
        throw new MoveConversationError('conversation no longer exists', 'unavailable');
    }
    conversation = refreshed;
    const copiedConversation = conversation;

    const messagesMap: Record<MessageId, Message> = yield select(selectMessagesByConversationId(conversationId));
    const messages = Object.values(messagesMap).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    if (messages.some((m) => m.placeholder)) {
        throw new MoveConversationError('conversation is generating a response', 'busy');
    }

    // Limits are enforced by the server, check upfront so the move doesn't fail halfway.
    const targetConversations: Record<string, Conversation> = yield select(selectConversationsBySpaceId(targetSpaceId));
    if (Object.keys(targetConversations).length >= MAX_CONVERSATIONS_PER_SPACE) {
        throw new MoveConversationError('target project has too many conversations', 'limit');
    }

    // Attachments owned by the source space and referenced by the messages move along. Other references (e.g. files
    // from another space) are left untouched.
    const referencedIds = new Set<AttachmentId>();
    for (const message of messages) {
        // A reference that names another space's file is not ours to move, and needs no lookup.
        message.attachments?.forEach((a) => {
            if (!a.spaceId || a.spaceId === conversation.spaceId) {
                referencedIds.add(a.id);
            }
        });
    }
    Object.values(conversation.artifactAssets ?? {}).forEach((pointer) => referencedIds.add(pointer.attachmentId));

    // Allocated first: copied generated files point back at the chat that produced them.
    const newConvId = newConversationId();

    const attachmentIdMap = new Map<AttachmentId, AttachmentId>();
    const newAttachments: Attachment[] = [];
    const discovery = newAssetDiscovery();
    for (const oldId of referencedIds) {
        const full: Attachment | undefined = yield call(resolveFullAttachment, oldId, conversation.spaceId, discovery);
        if (!full || full.spaceId !== conversation.spaceId) {
            continue;
        }
        const newId = newAttachmentId();
        attachmentIdMap.set(oldId, newId);

        const data = attachmentDataCache.getData(oldId);
        const imagePreview = attachmentDataCache.getImagePreview(oldId);
        if (data) {
            attachmentDataCache.setData(newId, data);
        }
        if (imagePreview) {
            attachmentDataCache.setImagePreview(newId, imagePreview);
        }
        newAttachments.push(
            cleanAttachment({
                ...full,
                id: newId,
                spaceId: targetSpaceId,
                processing: false,
                error: false,
                // The Library opens a generated file in the chat that produced it: that is the copy now.
                ...(full.generatedArtifactAsset && {
                    generatedArtifactAsset: {
                        ...full.generatedArtifactAsset,
                        conversationId:
                            full.generatedArtifactAsset.conversationId === conversationId
                                ? newConvId
                                : full.generatedArtifactAsset.conversationId,
                    },
                }),
            })
        );
    }

    const targetAttachments: Record<string, Attachment> = yield select(selectAttachmentsBySpaceId(targetSpaceId));
    if (Object.keys(targetAttachments).length + newAttachments.length > MAX_ASSETS_PER_SPACE) {
        newAttachments.forEach((a) => attachmentDataCache.delete(a.id));
        throw new MoveConversationError('target project has too many files', 'limit');
    }

    const messageIdMap = new Map<MessageId, MessageId>(messages.map((m) => [m.id, newMessageId()]));
    const remapMessageId = (id: MessageId) => messageIdMap.get(id) ?? id;
    const remapAttachmentId = (id: AttachmentId) => attachmentIdMap.get(id) ?? id;

    const newConversation: Conversation = cleanConversation({
        ...conversation,
        id: newConvId,
        spaceId: targetSpaceId,
        status: ConversationStatus.COMPLETED,
        artifactAssets: conversation.artifactAssets
            ? Object.fromEntries(
                  Object.entries(conversation.artifactAssets).map(([artifactId, pointer]) => [
                      artifactId,
                      {
                          attachmentId: remapAttachmentId(pointer.attachmentId),
                          syncedMessageId: remapMessageId(pointer.syncedMessageId),
                      },
                  ])
              )
            : undefined,
    });

    const newMessages: Message[] = messages.map((message) =>
        cleanMessage({
            ...message,
            id: remapMessageId(message.id),
            conversationId: newConvId,
            parentId: message.parentId ? messageIdMap.get(message.parentId) : undefined,
            // Generated images are referenced by id in both the content and its text blocks.
            content: message.content === undefined ? undefined : remapAttachmentUrls(message.content, attachmentIdMap),
            blocks: message.blocks?.map((block) =>
                block.type === 'text'
                    ? { ...block, content: remapAttachmentUrls(block.content, attachmentIdMap) }
                    : block
            ),
            attachments: message.attachments?.map((a) => remapShallowAttachment(a, attachmentIdMap, targetSpaceId)),
            contextFiles: message.contextFiles?.map(remapAttachmentId),
            compaction: message.compaction && {
                ...message.compaction,
                summarizedMessageIds: message.compaction.summarizedMessageIds.map(remapMessageId),
                keptMessageIds: message.compaction.keptMessageIds.map(remapMessageId),
            },
        })
    );

    yield put(
        moveConversationToSpaceProgress({
            ...request,
            stage: 'copying',
            total: newMessages.length + newAttachments.length + 1,
        })
    );

    // Everything is in Redux before the first push, so the push sagas find what they need.
    const channel = yield actionChannel((action: Action) => getPushOutcome(action) !== undefined, buffers.expanding(100));
    try {
        const pending = new Set<string>([
            pushKey('conversation', newConvId),
            ...newAttachments.map((a) => pushKey('attachment', a.id)),
            ...newMessages.map((m) => pushKey('message', m.id)),
        ]);

        yield put(addConversation(newConversation));
        created.conversationId = newConvId;
        yield put(pushConversationRequest({ id: newConvId }));

        for (const attachment of newAttachments) {
            yield put(addAttachment(attachment));
            created.attachmentIds.push(attachment.id);
            yield put(pushAttachmentRequest({ id: attachment.id }));
        }

        for (const message of newMessages) {
            yield put(addMessage(message));
            created.messageIds.push(message.id);
            yield put(pushMessageRequest({ id: message.id }));
        }

        yield call(waitForPushes, channel, pending);
    } finally {
        channel.close();
    }

    // Anything added to the original while the copy was syncing would be lost when it is deleted.
    const latest: Record<MessageId, Message> = yield select(selectMessagesByConversationId(conversationId));
    if (Object.values(latest).some((m) => !messageIdMap.has(m.id) || m.placeholder)) {
        throw new MoveConversationError('conversation changed while moving', 'busy');
    }
    // Metadata changes too, without any new message: a generated file that finishes uploading adds an
    // `artifactAssets` pointer, and a rename or favorite changes the title or star. The copy would miss
    // either while the cleanup deletes the original, silently discarding the change.
    const latestConversation: Conversation | undefined = yield select(selectConversationById(conversationId));
    if (
        !latestConversation ||
        hasPendingArtifactSync(conversationId) ||
        !isEqual(getTransferredMetadata(latestConversation), getTransferredMetadata(copiedConversation))
    ) {
        throw new MoveConversationError('conversation changed while moving', 'busy');
    }

    // Make the copied files searchable in the project, like files uploaded directly to it.
    for (const attachment of newAttachments) {
        yield put(indexAttachmentRequest({ id: attachment.id, attachment }));
    }

    return { newConversationId: newConvId, copiedAttachmentIds: [...attachmentIdMap.keys()] };
}

/** Removes message content from IndexedDB (tombstone, content stripped) and from Redux. */
function* purgeMessages(ids: MessageId[]): SagaIterator<void> {
    const dbApi: DbApi = yield getContext('dbApi');
    for (const id of ids) {
        yield call([dbApi, dbApi.softDeleteMessage], id, { dirty: true });
        yield put(deleteMessage(id));
    }
}

function* removeOriginal(conversationId: ConversationId, copiedSourceAttachmentIds: AttachmentId[]): SagaIterator<void> {
    const conversation: Conversation | undefined = yield select(selectConversationById(conversationId));
    if (!conversation) {
        return;
    }
    const space: Space | undefined = yield select(selectSpaceById(conversation.spaceId));
    const siblings: Record<string, Conversation> = yield select(selectConversationsBySpaceId(conversation.spaceId));

    if (space?.spaceType === SpaceType.Default && Object.keys(siblings).length <= 1) {
        // Legacy 1:1 space: deleting the chat means deleting the space with its files.
        yield call(softDeleteSpaceFromLocal, { payload: conversation.spaceId });
        return;
    }

    // The deletion sagas run inline instead of through their `takeEvery` watchers, so a failure reaches the caller
    // (which keeps the verified copy) rather than being lost in a detached task.
    yield call(softDeleteConversationFromLocal, { payload: conversationId });
    // Deleting a conversation alone leaves its messages behind, but a move must not keep a second copy of the chat.
    const originalMessages: Record<MessageId, Message> = yield select(selectMessagesByConversationId(conversationId));
    yield call(purgeMessages, Object.keys(originalMessages));
    // Files uploaded in a chat of a project are project files shared with its other chats, so they stay there.
    if (space?.spaceType !== SpaceType.Project) {
        for (const id of copiedSourceAttachmentIds) {
            yield call(softDeleteAttachmentFromLocal, { payload: id });
        }
    }
}

function* rollback(created: Created): SagaIterator<void> {
    if (created.conversationId) {
        yield put(locallyDeleteConversationFromLocalRequest(created.conversationId));
    }
    for (const id of created.attachmentIds) {
        yield put(locallyDeleteAttachmentFromLocalRequest(id));
    }
    yield call(purgeMessages, created.messageIds);
}

export function* moveConversationToSpace({
    payload,
}: PayloadAction<MoveConversationToSpaceRequest>): SagaIterator<void> {
    console.log('Saga triggered: moveConversationToSpace', payload);
    const { conversationId } = payload;
    const created: Created = { messageIds: [], attachmentIds: [] };

    if (inFlight.has(conversationId)) {
        yield put(moveConversationToSpaceFailure({ ...payload, error: 'move already in progress', reason: 'busy' }));
        return;
    }
    inFlight.add(conversationId);

    try {
        let copy: CopyResult;
        try {
            copy = yield call(copyConversation, payload, created);
        } catch (e) {
            // Nothing destructive has happened yet: undo the partial copy and keep the original.
            console.error('moveConversationToSpace failed', e);
            yield call(rollback, created);
            const error = e instanceof Error ? e.message : String(e);
            yield put(
                moveConversationToSpaceFailure({
                    ...payload,
                    error,
                    reason: e instanceof MoveConversationError ? e.reason : undefined,
                })
            );
            return;
        }

        // The copy is synced and verified, so the original can go. From here on a failure must never roll back:
        // once cleanup has started, the copy may be the only complete version of the chat.
        yield put(moveConversationToSpaceProgress({ ...payload, stage: 'finishing' }));
        let cleanupFailed = false;
        try {
            yield call(removeOriginal, conversationId, copy.copiedAttachmentIds);
        } catch (e) {
            cleanupFailed = true;
            console.error('moveConversationToSpace: the copy is kept but removing the original failed', e);
        }
        yield put(
            moveConversationToSpaceSuccess({
                ...payload,
                newConversationId: copy.newConversationId,
                ...(cleanupFailed && { cleanupFailed }),
            })
        );
    } finally {
        inFlight.delete(conversationId);
    }
}
