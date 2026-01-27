import type { Selector } from 'react-redux';

import type { UserState } from '@proton/account';

import type { LocalId, RemoteId, ResourceType } from '../remote/types';
import type { Attachment, AttachmentId, Conversation, Message, Space } from '../types';
import { type ConversationId, type MessageId, Role, type SpaceId } from '../types';
import { listify, mapIds, setify } from '../util/collections';
import { sortByDate } from '../util/date';
import { objectFilterV } from '../util/objects';
import { getInitials } from '../util/username';
import { EMPTY_ATTACHMENT_MAP } from './slices/core/attachments';
import { EMPTY_CONVERSATION_MAP } from './slices/core/conversations';
import { EMPTY_MESSAGE_MAP } from './slices/core/messages';
import { isNonEmptyPersonalization } from './slices/personalization';
import type { LumoState, LumoState as RootState } from './store';

export type LumoSelector<T> = Selector<LumoState, T>;

/*
 * Helper that wraps any selector to accept optional input, returning
 * a predefined fallback value if input is null/undefined.
 */
export const makeOptional =
    <TArg, TResult>(selector: (arg: TArg) => LumoSelector<TResult>, fallback: TResult) =>
    (arg: TArg | null | undefined): LumoSelector<TResult> =>
    (state: RootState) =>
        arg !== null && arg !== undefined ? selector(arg)(state) : fallback;

/*
 * Selectors from the shared Proton state.
 */

export const selectDisplayName = (state: UserState) => state.user.value?.DisplayName;
export const selectDisplayNameInitials = (state: UserState) => getInitials(selectDisplayName(state));

/*
 * Selectors specific to Lumo.
 */

export const selectMessages = (state: RootState) => state.messages;
export const selectMasterKey = (state: RootState) => state.credentials.masterKey;
export const selectConversations = (state: RootState) => state.conversations;
export const selectAttachments = (state: RootState) => state.attachments;

export const selectMessageById =
    (id: MessageId): LumoSelector<Message | undefined> =>
    (state: RootState): Message | undefined =>
        state.messages[id];

export const selectConversationById =
    (id: ConversationId): LumoSelector<Conversation | undefined> =>
    (state: RootState) =>
        state.conversations[id];

export const selectSpaceById =
    (id: SpaceId): LumoSelector<Space | undefined> =>
    (state: RootState) =>
        state.spaces[id];

export const selectAttachmentById =
    (id: SpaceId): LumoSelector<Attachment | undefined> =>
    (state: RootState) =>
        state.attachments[id];

export const selectAttachmentByIdOptional = makeOptional(selectAttachmentById, undefined);

export const selectMessagesByConversationId =
    (conversationId: ConversationId | null | undefined) => (state: LumoState) =>
        objectFilterV(state.messages, (m: Message) => m.conversationId === conversationId, EMPTY_MESSAGE_MAP);

export const selectConversationsBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) =>
    objectFilterV(state.conversations, (c: Conversation) => c.spaceId === spaceId, EMPTY_CONVERSATION_MAP);

export const selectMessagesBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) => {
    const conversationIds = setify(mapIds(selectConversationsBySpaceId(spaceId)(state)));
    return objectFilterV(state.messages, (m: Message) => conversationIds.has(m.conversationId), EMPTY_MESSAGE_MAP);
};

export const selectAttachmentsBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) =>
    objectFilterV(state.attachments, (c: Attachment) => c.spaceId === spaceId, EMPTY_ATTACHMENT_MAP);

export const selectAttachmentLoadingState = (attachmentId: AttachmentId) => (state: LumoState) =>
    state.attachmentLoadingState[attachmentId];

export const selectAttachmentLoadingStateOptional = makeOptional(selectAttachmentLoadingState, undefined);

export const selectSpaceByIdOptional = makeOptional(selectSpaceById, undefined);

export const selectAllUserMessages = (state: LumoState) =>
    objectFilterV(state.messages, (m: Message) => m.role === Role.User);

export const selectFavoritedConversations = (state: LumoState) =>
    objectFilterV(state.conversations, (c: Conversation) => !!c.starred);

export const selectSpaceByConversationId =
    (conversationId: ConversationId) =>
    (state: LumoState): Space | undefined => {
        const conversation = selectConversationById(conversationId)(state);
        return conversation && state.spaces[conversation.spaceId];
    };

export const selectProvisionalAttachments = (state: LumoState) =>
    listify(state.attachments)
        .filter((a: Attachment) => !a.spaceId)
        .toSorted(sortByDate('asc', 'uploadedAt'));

export const selectLocalIdFromRemote =
    (type: ResourceType, remoteId: RemoteId) =>
    (state: LumoState): LocalId | undefined =>
        state.idmap.remote2local[type][remoteId];

export const selectRemoteIdFromLocal =
    (type: ResourceType, localId: LocalId) =>
    (state: LumoState): RemoteId | undefined =>
        state.idmap.local2remote[type][localId];

export const selectPersonalizationSettings = (state: LumoState) => state.personalization;
export const selectHasModifiedPersonalization = (state: LumoState) =>
    isNonEmptyPersonalization(selectPersonalizationSettings(state));

export const selectContextFilters = (state: any) => state.contextFilters.filters;

export const selectContextFiltersForMessage = (messageId: string) => (state: any) => {
    return state.contextFilters.filters.find((filter: any) => filter.messageId === messageId);
};

export const selectIsFileExcluded = (messageId: string, filename: string) => (state: any) => {
    const filter = state.contextFilters.filters.find((filter: any) => filter.messageId === messageId);
    return filter ? filter.excludedFiles.includes(filename) : false;
};
