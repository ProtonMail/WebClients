import type { Selector } from 'react-redux';

import { createSelector } from '@reduxjs/toolkit';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { UserState } from '@proton/account';

import type { ConversationDateGroupKey } from '../layouts/sidepanel/helpers';
import { getConversationDateGroupKey } from '../layouts/sidepanel/helpers';
import { isGeneratedImageAttachment } from '../lib/imageAttachment';
import type { LocalId, RemoteId, ResourceType } from '../remote/types';
import type { Attachment, AttachmentId, Base64, Conversation, Message, Space } from '../types';
import { type ConversationId, type MessageId, Role, type SpaceId } from '../types';
import { listify, mapIds, setify } from '../util/collections';
import { sortByDate } from '../util/date';
import { objectFilterV } from '../util/objects';
import { getInitials } from '../util/username';
import type { AttachmentMap } from './slices/core/attachments';
import { EMPTY_ATTACHMENT_MAP } from './slices/core/attachments';
import { EMPTY_CONVERSATION_MAP } from './slices/core/conversations';
import type { MessageMap } from './slices/core/messages';
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
export const selectMasterKeyState = (state: RootState) => state.credentials.masterKeyState;

/**
 * Narrowing helper. Returns the key only when it is actually available, so existing
 * `if (!masterKey)` read sites keep their current behaviour: they treat every non-ready state as
 * "no key". Anything that needs to distinguish "not yet" from "failed" — the UI, and the saga
 * helper in `sagas/masterKey.ts` — should read `selectMasterKeyState` instead.
 */
export const selectMasterKey = (state: RootState): Base64 | undefined => {
    const masterKeyState = state.credentials.masterKeyState;
    return masterKeyState.status === 'ready' ? masterKeyState.masterKey : undefined;
};
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
        conversationId
            ? objectFilterV(state.messages, (m: Message) => m.conversationId === conversationId, EMPTY_MESSAGE_MAP)
            : EMPTY_MESSAGE_MAP;

/**
 * Groups every non-placeholder message by conversationId in a single pass, sorted newest-first
 * within each group. Use this (not `selectMessagesByConversationId` in a loop) when you need
 * messages for many/all conversations at once — looking a conversation up here is O(1) instead
 * of re-scanning the whole message map per conversation.
 */
export const groupMessagesByConversationId = (messages: MessageMap): Record<ConversationId, Message[]> => {
    const grouped: Record<ConversationId, Message[]> = {};

    Object.values(messages).forEach((message: Message) => {
        if (message.placeholder) {
            return;
        }
        (grouped[message.conversationId] ??= []).push(message);
    });

    Object.values(grouped).forEach((conversationMessages) => {
        conversationMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return grouped;
};

export const selectMessagesGroupedByConversationId = createSelector([selectMessages], groupMessagesByConversationId);

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
        .filter((a: Attachment) => !a.spaceId && !a.conversationContext)
        .toSorted(sortByDate('asc', 'uploadedAt'));

/** All attachment IDs referenced by messages — must survive composer provisional cleanup. */
export const selectMessageAttachmentIds = createSelector(
    (state: LumoState) => state.messages,
    (messages): AttachmentId[] => {
        const ids = new Set<AttachmentId>();
        for (const message of Object.values(messages)) {
            message.attachments?.forEach((att) => ids.add(att.id));
        }
        return [...ids];
    }
);

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

/*
 * Memoized selectors — use with shallowEqual in useLumoSelector to avoid
 * re-renders when the derived data hasn't meaningfully changed.
 */

const selectChatHistoryDateField = (state: LumoState) => state.lumoUserSettings.chatHistoryDateField ?? 'updatedAt';

// Sorted array of starred (non-ghost) conversations, always by creation date.
// Sidebar favorites use this order regardless of the history sort preference.
export const selectStarredConversationsSorted = createSelector([selectConversations], (conversations) =>
    Object.values(conversations)
        .filter((c: Conversation) => !c.ghost && c.starred === true)
        .sort(sortByDate<Conversation>('desc', 'createdAt'))
);

// Conversation count per spaceId. Does NOT change when only titles stream —
// use with shallowEqual so project lists skip re-renders during streaming.
export const selectConversationCountsBySpaceId = createSelector([selectConversations], (conversations) => {
    const counts: Record<string, number> = {};
    Object.values(conversations).forEach((c: Conversation) => {
        if (c.spaceId) {
            counts[c.spaceId] = (counts[c.spaceId] ?? 0) + 1;
        }
    });
    return counts;
});

// Attachment count per spaceId (excluding errored/processing attachments).
export const selectAttachmentCountsBySpaceId = createSelector([selectAttachments], (attachments) => {
    const counts: Record<string, number> = {};
    Object.values(attachments).forEach((a: Attachment) => {
        if (a.spaceId && !a.error && !a.processing) {
            counts[a.spaceId] = (counts[a.spaceId] ?? 0) + 1;
        }
    });
    return counts;
});

// Pre-filtered, sorted base list for chat history. Excludes ghost and starred
// conversations (starred appear in the sidebar favorites section).
export const selectHistoryConversationsSorted = createSelector(
    [selectConversations, selectChatHistoryDateField],
    (conversations, dateField) =>
        Object.values(conversations)
            .filter((c: Conversation) => !c.ghost && !c.starred)
            .sort(sortByDate<Conversation>('desc', dateField))
);

// Minimal per-conversation row for the chat history list — contains only stable
// fields (id, groupKey, spaceId, createdAt). title and status are intentionally
// excluded so this selector's output does NOT change during LLM streaming.
// Pair with historyRowsEqual so ChatHistory skips re-renders while tokens stream.
export interface ConversationHistoryRow {
    id: string;
    groupKey: ConversationDateGroupKey;
    spaceId?: string;
    createdAt: string;
}

export const selectHistoryConversationRows = createSelector(
    [selectConversations, selectChatHistoryDateField],
    (conversations, dateField): ConversationHistoryRow[] => {
        const now = startOfDay(new Date());
        return Object.values(conversations)
            .filter((c: Conversation) => !c.ghost && !c.starred)
            .sort(sortByDate<Conversation>('desc', dateField))
            .map((c: Conversation) => {
                const dateValue = (c[dateField as keyof Conversation] as string | undefined) ?? c.updatedAt;
                const dayDiff = differenceInCalendarDays(now, startOfDay(new Date(dateValue)));
                return {
                    id: c.id,
                    groupKey: getConversationDateGroupKey(dayDiff),
                    spaceId: c.spaceId,
                    createdAt: c.createdAt,
                };
            });
    }
);

// Element-wise equality for ConversationHistoryRow[]. Stable during streaming
// because title and status are excluded from rows — only structural fields compared.
export const historyRowsEqual = (a: ConversationHistoryRow[], b: ConversationHistoryRow[]): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (
            a[i].id !== b[i].id ||
            a[i].groupKey !== b[i].groupKey ||
            a[i].spaceId !== b[i].spaceId ||
            a[i].createdAt !== b[i].createdAt
        ) {
            return false;
        }
    }
    return true;
};

function messageHasGeneratedImages(message: Message, attachments: AttachmentMap): boolean {
    return (message.attachments ?? []).some((shallow) => {
        const attachment = attachments[shallow.id] ?? shallow;
        return isGeneratedImageAttachment(attachment);
    });
}

export const selectMessageHasGeneratedImages =
    (messageId: MessageId): LumoSelector<boolean> =>
    (state) => {
        const message = state.messages[messageId];
        if (!message) {
            return false;
        }

        return messageHasGeneratedImages(message, state.attachments);
    };

export const selectConversationHasGeneratedImages =
    (conversationId: ConversationId | null | undefined): LumoSelector<boolean> =>
    (state) => {
        if (!conversationId) {
            return false;
        }

        const messages = selectMessagesByConversationId(conversationId)(state);
        return Object.values(messages).some((message) => messageHasGeneratedImages(message, state.attachments));
    };

export const selectConversationsHaveGeneratedImages =
    (conversationIds: ConversationId[]): LumoSelector<boolean> =>
    (state) => {
        if (conversationIds.length === 0) {
            return false;
        }

        const conversationIdSet = new Set(conversationIds);
        return Object.values(state.messages).some(
            (message) =>
                conversationIdSet.has(message.conversationId) && messageHasGeneratedImages(message, state.attachments)
        );
    };

export const selectAnyGeneratedImages = createSelector([selectMessages, selectAttachments], (messages, attachments) =>
    Object.values(messages).some((message) => messageHasGeneratedImages(message, attachments))
);
