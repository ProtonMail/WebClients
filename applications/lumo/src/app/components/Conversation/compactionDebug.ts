import type { Api } from '@proton/shared/lib/interfaces';

import { compactConversation } from '../../llm/compaction';
import { buildLinearChain } from '../../messageTree';
import { selectAttachments, selectContextFilters, selectMessagesByConversationId } from '../../redux/selectors';
import { updateConversationStatus } from '../../redux/slices/core/conversations';
import {
    addMessage,
    createDate,
    deleteMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../../redux/store';
import {
    type Attachment,
    type CompactionMeta,
    type ConversationId,
    ConversationStatus,
    type Message,
    Role,
} from '../../types';

export type DebugCompactParams = {
    api: Api;
    conversationId: ConversationId;
    /**
     * When true, run the LLM summarization step even if the cheaper strategies
     * already bring the summarized region within budget.
     */
    forceLlmSummary?: boolean;
};

const EMPTY_COMPACTION_STATS = {
    tokensBefore: 0,
    tokensAfter: 0,
    tokensRemoved: 0,
    summarizedMessageCount: 0,
    keptMessageCount: 0,
    clearedToolResultCount: 0,
    appliedStrategies: [],
    usedLlmSummary: false,
} as const;

/**
 * Debug-only: run compaction on the currently displayed branch of a conversation
 * and materialize a compaction-boundary message under its leaf, mirroring what the
 * automatic compaction flow does — but without running a generation afterwards.
 *
 * Unlike the production flow this does not create an assistant placeholder to
 * generate into; it only inserts the boundary so the compacted view (and its
 * effect on subsequent requests, e.g. freeing image slots) takes effect.
 */
export function debugCompactCurrentConversation(params: DebugCompactParams) {
    return async (dispatch: LumoDispatch, getState: () => LumoState): Promise<void> => {
        const { api, conversationId, forceLlmSummary } = params;

        const state = getState();
        const conversationMessages = selectMessagesByConversationId(conversationId)(state);

        // The displayed leaf is the most recent message; passing null lets buildLinearChain
        // resolve it. We scope to this conversation's messages so we don't walk into others.
        const chain = buildLinearChain(conversationMessages, null, []);
        if (chain.length < 2) {
            throw new Error('Not enough messages in this conversation to compact.');
        }

        const leaf = chain[chain.length - 1];
        const attachments = Object.values(selectAttachments(state)) as Attachment[];
        const contextFilters = selectContextFilters(state);

        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

        const now = createDate();
        const boundaryId = newMessageId();

        // Show an in-progress boundary immediately (the LLM summary step can take a while).
        const inProgressBoundary: Message = {
            id: boundaryId,
            parentId: leaf.id,
            conversationId,
            createdAt: now,
            role: Role.Assistant,
            status: 'succeeded',
            placeholder: false,
            blocks: [],
            compaction: {
                status: 'compacting',
                summary: '',
                summarizedMessageIds: [],
                keptMessageIds: [],
                stats: { ...EMPTY_COMPACTION_STATS, appliedStrategies: [] },
                createdAt: now,
            },
        };
        dispatch(addMessage(inProgressBoundary));

        let result;
        try {
            result = await compactConversation(chain, api, {
                attachments,
                contextFilters,
                forceLlmSummary,
            });
        } catch (error) {
            // Revert: drop the placeholder boundary so the conversation is unchanged.
            dispatch(deleteMessage(boundaryId));
            dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
            throw error;
        }

        const compaction: CompactionMeta = {
            status: 'done',
            summary: result.summary,
            summarizedMessageIds: result.summarizedMessageIds,
            keptMessageIds: result.keptMessageIds,
            stats: result.stats,
            createdAt: now,
        };

        const boundary: Message = { ...inProgressBoundary, compaction };
        dispatch(addMessage(boundary));
        dispatch(pushMessageRequest({ id: boundary.id }));
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
    };
}
