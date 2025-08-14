import type { Selector } from 'react-redux';

import type { UserState } from '@proton/account';

import type { LocalId, RemoteId, ResourceType } from '../remote/types';
import type { Attachment, Conversation, Message, Space } from '../types';
import { type ConversationId, type MessageId, Role, type SpaceId } from '../types';
import { listify, mapIds, setify } from '../util/collections';
import { sortByDate } from '../util/date';
import { objectFilterV } from '../util/objects';
import { getInitials } from '../util/username';
import { EMPTY_MESSAGE_MAP } from './slices/core/messages';
import type { LumoState, LumoState as RootState } from './store';

export type LumoSelector<T> = Selector<LumoState, T>;

/*
 * Selectors specific to this app's state.
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

export const selectMessagesByConversationId =
    (conversationId: ConversationId | null | undefined) => (state: LumoState) =>
        objectFilterV(state.messages, (m: Message) => m.conversationId === conversationId, EMPTY_MESSAGE_MAP);

export const selectConversationsBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) =>
    objectFilterV(state.conversations, (c: Conversation) => c.spaceId === spaceId);

export const selectMessagesBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) => {
    const conversationIds = setify(mapIds(selectConversationsBySpaceId(spaceId)(state)));
    return objectFilterV(state.messages, (m: Message) => conversationIds.has(m.conversationId));
};

export const selectAttachmentsBySpaceId = (spaceId: SpaceId | null | undefined) => (state: LumoState) =>
    objectFilterV(state.attachments, (c: Attachment) => c.spaceId === spaceId);

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

/*
 * Selectors from the shared Proton state.
 */

export const selectDisplayName = (state: UserState) => state.user.value?.DisplayName;
export const selectDisplayNameInitials = (state: UserState) => getInitials(selectDisplayName(state));

// Context filters selectors
export const selectContextFilters = (state: any) => state.contextFilters.filters;

export const selectContextFiltersForMessage = (messageId: string) => (state: any) => {
    return state.contextFilters.filters.find((filter: any) => filter.messageId === messageId);
};

export const selectIsFileExcluded = (messageId: string, filename: string) => (state: any) => {
    const filter = state.contextFilters.filters.find((filter: any) => filter.messageId === messageId);
    return filter ? filter.excludedFiles.includes(filename) : false;
};
