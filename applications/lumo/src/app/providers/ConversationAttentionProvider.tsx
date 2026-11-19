import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { shallowEqual } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { createSelector } from '@reduxjs/toolkit';

import {
    getPendingToolApprovals,
    isDesktopEnvironment,
    subscribeToolApprovals,
} from '@proton/lumo-api-client/core/desktop-tools';

import { getLastValidatedToolCall } from '../components/Conversation/messageChain/message/getLastValidatedToolCall';
import { ASK_USER_QUESTIONS_TOOL_NAME } from '../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import {
    isAskUserQuestionsToolSuccessResult,
    validateAskUserQuestionsToolArguments,
} from '../features/client-tools/askUserQuestionsTool/validation';
import { CREATE_SCHEDULE_TOOL_NAME } from '../features/client-tools/createScheduleTool/createScheduleTool';
import {
    isCreateScheduleToolSuccessResult,
    validateCreateScheduleToolArguments,
} from '../features/client-tools/createScheduleTool/validation';
import { getMessageBlocks } from '../messageHelpers';
import { useLumoSelector } from '../redux/hooks';
import { selectConversations, selectMessages } from '../redux/selectors';
import type { ConversationId, Message, SpaceId } from '../types';
import { Role } from '../types';

/**
 * What a conversation waits on the user for. Each request gets its own key, so a new request after an
 * answered one reads as new (the dot pops in again), while re-renders of the same request do not.
 */
type AttentionKey = `approval:${string}` | `card:${string}`;
type SpaceAttention = { conversationId: ConversationId; key?: AttentionKey };

interface AttentionKeys {
    byConversation: ReadonlyMap<ConversationId, AttentionKey | undefined>;
    bySpace: ReadonlyMap<SpaceId, SpaceAttention>;
}

const AttentionContext = createContext<AttentionKeys | null>(null);

// Redux replaces a message object when its blocks change. The WeakMap lets unchanged replies
// reuse their parsed card metadata and lets removed messages be garbage-collected.
const cardCache = new WeakMap<Message, { questionKey?: string; hasScheduleDraft: boolean }>();
const messageTimeCache = new WeakMap<Message, number>();

function getMessageTime(message: Message): number {
    const cached = messageTimeCache.get(message);
    if (cached !== undefined) return cached;

    const time = Date.parse(message.createdAt);
    messageTimeCache.set(message, time);
    return time;
}

/**
 * Find the cards a reply can render using the same tool-call validation as the card components.
 * A card requires valid arguments and a successful tool result, which can arrive later in the stream.
 */
function getMessageCards(message: Message) {
    const cached = cardCache.get(message);
    if (cached) {
        return cached;
    }

    const blocks = getMessageBlocks(message);
    const questions = getLastValidatedToolCall(
        blocks,
        ASK_USER_QUESTIONS_TOOL_NAME,
        isAskUserQuestionsToolSuccessResult,
        validateAskUserQuestionsToolArguments
    );
    // Only desktop renders schedule cards. The same tool result covers both the connector
    // access request and the draft waiting for Schedule or Cancel.
    const hasScheduleDraft =
        isDesktopEnvironment() &&
        !!getLastValidatedToolCall(
            blocks,
            CREATE_SCHEDULE_TOOL_NAME,
            isCreateScheduleToolSuccessResult,
            validateCreateScheduleToolArguments
        );
    const cards = {
        questionKey: questions ? `${message.id}:${questions.id}` : undefined,
        hasScheduleDraft,
    };

    cardCache.set(message, cards);
    return cards;
}

function haveSameCardRequests(
    previous: ReadonlyMap<ConversationId, AttentionKey>,
    next: ReadonlyMap<ConversationId, AttentionKey>
): boolean {
    if (previous.size !== next.size) return false;

    // Space grouping uses request order to break ties between conversations in the same space.
    const nextEntries = next.entries();
    for (const [conversationId, key] of previous) {
        const entry = nextEntries.next().value;
        if (entry?.[0] !== conversationId || entry[1] !== key) return false;
    }
    return true;
}

/**
 * Find requests on the newest message in each conversation. Answering or skipping a question card
 * adds a newer user turn, which clears the attention indicator.
 */
const selectConversationsAwaitingCard = createSelector(
    [selectMessages],
    (messages) => {
        const latest = new Map<ConversationId, { message: Message; time: number }>();
        for (const message of Object.values(messages)) {
            const time = getMessageTime(message);
            const current = latest.get(message.conversationId);
            if (!current || time > current.time) {
                latest.set(message.conversationId, { message, time });
            }
        }

        const awaiting = new Map<ConversationId, AttentionKey>();
        for (const [conversationId, { message }] of latest) {
            if (message.role !== Role.Assistant) continue;
            const { questionKey, hasScheduleDraft } = getMessageCards(message);
            if (questionKey) {
                awaiting.set(conversationId, `card:${questionKey}`);
            } else if (hasScheduleDraft) {
                awaiting.set(conversationId, `card:${message.id}`);
            }
        }
        return awaiting;
    },
    { memoizeOptions: { resultEqualityCheck: haveSameCardRequests } }
);

const selectPendingSpaceIds = createSelector(
    [selectConversations, (_state: unknown, pending: ReadonlyMap<ConversationId, AttentionKey>) => pending],
    (conversations, pending) =>
        Object.fromEntries(Array.from(pending.keys(), (id) => [id, conversations[id]?.spaceId] as const)),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

/**
 * Pending desktop tool approvals, including those of scheduled runs. Requests without a conversation come
 * from older desktop builds: they show in whichever chat is open, so they do not mark any row.
 */
const usePendingApprovals = () => useSyncExternalStore(subscribeToolApprovals, getPendingToolApprovals);

/** Track which pending requests the user has already seen during this app session. */
export const ConversationAttentionProvider = ({ children }: { children: ReactNode }) => {
    const currentConversationId = useRouteMatch<{ conversationId: ConversationId }>('/c/:conversationId')?.params
        .conversationId;
    const approvals = usePendingApprovals();
    const cards = useLumoSelector(selectConversationsAwaitingCard);
    const [seenKeys, setSeenKeys] = useState<ReadonlySet<AttentionKey>>(() => new Set());

    const pending = useMemo(() => {
        const requests = new Map<ConversationId, AttentionKey>();
        // Show the oldest approval first, then fall back to conversation cards.
        for (const request of approvals) {
            if (request.conversationId && !requests.has(request.conversationId)) {
                requests.set(request.conversationId, `approval:${request.requestId}`);
            }
        }
        for (const [conversationId, key] of cards) {
            if (!requests.has(conversationId)) {
                requests.set(conversationId, key);
            }
        }
        return requests;
    }, [approvals, cards]);

    const pendingSpaceIds = useLumoSelector((state) => selectPendingSpaceIds(state, pending));

    const currentKey = currentConversationId ? pending.get(currentConversationId) : undefined;

    useEffect(() => {
        if (currentKey) {
            setSeenKeys((previous) => (previous.has(currentKey) ? previous : new Set(previous).add(currentKey)));
        }
    }, [currentKey]);

    const value = useMemo(() => {
        const byConversation = new Map<ConversationId, AttentionKey | undefined>();
        const bySpace = new Map<SpaceId, SpaceAttention>();
        for (const [conversationId, key] of pending) {
            // Seen requests still count as pending for row visibility and schedule links.
            const dotKey = conversationId === currentConversationId || seenKeys.has(key) ? undefined : key;
            byConversation.set(conversationId, dotKey);
            const spaceId = pendingSpaceIds[conversationId];
            if (spaceId) {
                const existing = bySpace.get(spaceId);
                if (!existing || (!existing.key && dotKey)) {
                    bySpace.set(spaceId, { conversationId, key: dotKey });
                }
            }
        }
        return { byConversation, bySpace };
    }, [pending, pendingSpaceIds, currentConversationId, seenKeys]);

    return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>;
};

/** Pending requests by conversation and space. Seen requests have no dot key. */
export function useAttentionKeys(): AttentionKeys {
    const attention = useContext(AttentionContext);
    if (!attention) {
        throw new Error('ConversationAttentionProvider is missing');
    }
    return attention;
}

/** Dot key for a pending request that the user has yet to see. */
export function useConversationAttention(conversationId: ConversationId): AttentionKey | undefined {
    return useAttentionKeys().byConversation.get(conversationId);
}

/** Combined key of a group of items, such as a sidebar section, or undefined when none waits on the user. */
export function getGroupAttentionKey(keys: (AttentionKey | undefined)[]): string | undefined {
    const pending = keys.filter((key) => key !== undefined);
    return pending.length > 0 ? pending.join('|') : undefined;
}
