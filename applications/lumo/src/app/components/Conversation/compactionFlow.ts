import type { Api } from '@proton/shared/lib/interfaces';

import { sendMessageWithRedux } from '../../lib/lumo-api-client/integrations/redux';
import type { AssistantCallOptions, LumoApiClientConfig } from '../../lib/lumo-api-client/core/types';
import type { GenerationResponseMessage } from '../../types-api';
import type { ContextFilter } from '../../llm';
import { compactConversation, estimateTurnsTokens, PROACTIVE_COMPACTION_THRESHOLD_TOKENS } from '../../llm/compaction';
import { NotEnoughToCompactError } from '../../llm/compaction/partition';
import {
    addMessage,
    createDate,
    deleteMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import { updateConversationStatus } from '../../redux/slices/core/conversations';
import type { LumoDispatch } from '../../redux/store';
import { isContextLengthExceededError } from '../../services/errors/contextLengthError';
import {
    type Attachment,
    type CompactionMeta,
    type ConversationId,
    ConversationStatus,
    type Message,
    type MessageId,
    Role,
    type SpaceId,
    type Turn,
} from '../../types';

/** Options forwarded to sendMessageWithRedux, minus the per-attempt identifiers we manage here. */
type ForwardedSendOptions = AssistantCallOptions & {
    config?: Partial<LumoApiClientConfig>;
    generateTitle?: boolean;
    errorHandler?: (message: GenerationResponseMessage, conversationId: string) => any;
};

export type GenerationWithCompactionParams = {
    api: Api;
    conversationId: ConversationId;
    spaceId: SpaceId;
    /** Assistant message the first attempt streams into. */
    assistantMessageId: MessageId;
    /** Parent of the assistant message (the user question). Compaction branches attach here. */
    parentMessageId: MessageId;
    /** Linear chain up to and including the user question (excludes the assistant placeholder). */
    chain: Message[];
    /** Rebuilds turns for a (possibly compacted) chain. Must call prepareTurns under the hood. */
    buildTurns: (chain: Message[]) => Turn[];
    /** Full conversation attachments, so compaction can account for real attachment token cost. */
    attachments?: Attachment[];
    /** Per-message attachment exclusions, so excluded files aren't counted as reclaimed. */
    contextFilters?: ContextFilter[];
    /** Options passed through to sendMessageWithRedux. */
    sendOptions: ForwardedSendOptions;
    /** Pins a sibling in the UI so the compacted branch is the one displayed. */
    preferSibling?: (message: Message) => void;
    /** Max number of compaction+retry cycles before giving up. */
    maxCompactions?: number;
    /**
     * Compact pre-emptively when the estimated request size already exceeds the
     * threshold, instead of waiting for the backend to reject it. Enabled by default.
     */
    enableProactiveCompaction?: boolean;
    /** Estimated-token threshold that triggers proactive compaction. */
    proactiveThresholdTokens?: number;
};

// Allows e.g. one proactive pass plus one reactive retry, while still bounding loops.
const DEFAULT_MAX_COMPACTIONS = 2;

/**
 * Run a generation, transparently recovering from `context_length_exceeded`.
 *
 * On overflow it runs the compaction engine over the current chain, inserts a
 * compaction-boundary message (a new branch under the user question) recording
 * what was condensed, creates a fresh assistant message under that boundary, and
 * retries — so the model only ever sees the compacted context going forward. The
 * failed attempt is discarded from the active branch but the full history is
 * preserved elsewhere in the tree.
 */
export function runGenerationWithCompaction(params: GenerationWithCompactionParams) {
    return async (dispatch: LumoDispatch): Promise<void> => {
        const {
            api,
            conversationId,
            spaceId,
            assistantMessageId,
            parentMessageId,
            chain,
            buildTurns,
            attachments,
            contextFilters,
            sendOptions,
            preferSibling,
            maxCompactions = DEFAULT_MAX_COMPACTIONS,
            enableProactiveCompaction = true,
            proactiveThresholdTokens = PROACTIVE_COMPACTION_THRESHOLD_TOKENS,
        } = params;

        let currentChain = chain;
        let currentAssistantId = assistantMessageId;
        let currentParentId = parentMessageId;
        let compactions = 0;

        /** Run compaction, materialize the branch, and advance the local cursors. */
        const compactAndAdvance = async (): Promise<void> => {
            const branch = await dispatch(
                compactAndBranch({
                    api,
                    conversationId,
                    parentMessageId: currentParentId,
                    failedAssistantId: currentAssistantId,
                    chain: currentChain,
                    attachments,
                    contextFilters,
                    signal: sendOptions.signal,
                    preferSibling,
                })
            );
            preferSibling?.(branch.boundary);
            currentChain = [...currentChain, branch.boundary];
            currentAssistantId = branch.assistant.id;
            currentParentId = branch.boundary.id;
            compactions += 1;
        };

        // Proactive pass: if the request is already too large to fit, compact
        // before the first send. This summarizes older turns (dropping their
        // re-sent attachments) while keeping the recent tail — including the
        // current question's attachments — intact.
        if (enableProactiveCompaction && compactions < maxCompactions) {
            let estimatedTokens = 0;
            try {
                estimatedTokens = estimateTurnsTokens(buildTurns(currentChain));
            } catch {
                estimatedTokens = 0;
            }
            if (estimatedTokens >= proactiveThresholdTokens) {
                try {
                    await compactAndAdvance();
                } catch (proactiveError) {
                    // Nothing to compact, or compaction failed: fall through and
                    // attempt the send as-is (the reactive path can still catch overflow).
                    if (!(proactiveError instanceof NotEnoughToCompactError)) {
                        console.warn('Proactive compaction failed; sending without it', proactiveError);
                    }
                }
            }
        }

        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const turns = buildTurns(currentChain);
                await dispatch(
                    sendMessageWithRedux(api, turns, {
                        ...sendOptions,
                        messageId: currentAssistantId,
                        conversationId,
                        spaceId,
                    })
                );
                return;
            } catch (error) {
                if (!isContextLengthExceededError(error) || compactions >= maxCompactions) {
                    throw error;
                }

                try {
                    await compactAndAdvance();
                } catch (compactionError) {
                    // Nothing to compact, or compaction itself failed — surface the original overflow.
                    if (compactionError instanceof NotEnoughToCompactError) {
                        throw error;
                    }
                    throw compactionError;
                }
            }
        }
    };
}

type CompactAndBranchParams = {
    api: Api;
    conversationId: ConversationId;
    parentMessageId: MessageId;
    failedAssistantId: MessageId;
    chain: Message[];
    attachments?: Attachment[];
    contextFilters?: ContextFilter[];
    signal?: AbortSignal;
    /** Pins a sibling so the in-progress boundary is shown while compaction runs. */
    preferSibling?: (message: Message) => void;
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
 * Run compaction and materialize the resulting branch in Redux:
 *  - a compaction-boundary message (child of the user question), and
 *  - a fresh assistant placeholder (child of the boundary) to generate into.
 *
 * The boundary is created up-front in a `compacting` state and pinned, so the UI
 * shows that compaction is underway (the engine — especially its LLM summary
 * step — can take a while), then filled in once the summary is ready. The failed
 * attempt is only discarded on success; if compaction itself fails we remove the
 * placeholder boundary and re-pin the original attempt so the error surfaces.
 */
function compactAndBranch(params: CompactAndBranchParams) {
    return async (dispatch: LumoDispatch): Promise<{ boundary: Message; assistant: Message }> => {
        const {
            api,
            conversationId,
            parentMessageId,
            failedAssistantId,
            chain,
            attachments,
            contextFilters,
            signal,
            preferSibling,
        } = params;

        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

        const now = createDate();
        const boundaryId = newMessageId();

        // Show an in-progress boundary immediately (kept alongside the failed
        // attempt for now, so we can cleanly revert if compaction throws).
        const inProgressBoundary: Message = {
            id: boundaryId,
            parentId: parentMessageId,
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
        preferSibling?.(inProgressBoundary);

        let result;
        try {
            result = await compactConversation(chain, api, { signal, attachments, contextFilters });
        } catch (error) {
            // Revert: drop the placeholder boundary and restore the original attempt.
            dispatch(deleteMessage(boundaryId));
            preferSibling?.({ id: failedAssistantId } as Message);
            throw error;
        }

        // Discard the failed attempt from the active branch (full history is preserved
        // via the original messages, which are still summarized into the boundary).
        dispatch(deleteMessage(failedAssistantId));

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

        const assistant: Message = {
            id: newMessageId(),
            parentId: boundary.id,
            conversationId,
            createdAt: createDate(),
            role: Role.Assistant,
            content: '',
            placeholder: true,
            blocks: [],
        };
        dispatch(addMessage(assistant));

        return { boundary, assistant };
    };
}
