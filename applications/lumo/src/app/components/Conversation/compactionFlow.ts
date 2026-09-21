import type { AssistantCallOptions, LumoApiClientConfig } from '@proton/lumo-api-client/core/types';
import type { Api } from '@proton/shared/lib/interfaces';

import { sendMessageWithRedux } from '../../lib/lumoApiClientRedux';
import type { ContextFilter } from '../../llm';
import { PROACTIVE_COMPACTION_THRESHOLD_TOKENS, compactConversation, estimateTurnsTokens } from '../../llm/compaction';
import { NotEnoughToCompactError } from '../../llm/compaction/partition';
import { updateConversationStatus } from '../../redux/slices/core/conversations';
import {
    addMessage,
    createDate,
    deleteMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import type { LumoDispatch } from '../../redux/store';
import { isContextLengthExceededError } from '../../services/errors/contextLengthError';
import { isAbortError, throwIfAborted } from '../../services/generation/abortGeneration';
import { generationRegistry } from '../../services/generation/generationRegistry';
import { clearSuspendedChain, setSuspendedChain } from '../../services/generation/toolBudgetStore';
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
import type { GenerationResponseMessage } from '../../types-api';
import { createArtifactToolExecutor } from './artifact/createArtifactTool';
import type { ArtifactToolMode } from './helper';

/** Options forwarded to sendMessageWithRedux, minus the per-attempt identifiers we manage here. */
type ForwardedSendOptions = AssistantCallOptions & {
    config?: Partial<LumoApiClientConfig>;
    generateTitle?: boolean;
    errorHandler?: (message: GenerationResponseMessage, conversationId: string) => any;
    /** Whether/how the `create_artifact` client tool is registered for this request. See `resolveArtifactToolMode`. */
    artifactToolMode?: ArtifactToolMode;
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
    /** Conversation-scoped messages, so an edited fork reuses the shared-history boundary. */
    messageMap?: Record<MessageId, Message>;
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

// One boundary per send. A second pass on the same request only re-summarizes an
// already-condensed head — it stacks another marker in the UI without freeing
// meaningful space, because what remains over the limit is file content, which the
// per-request file budget handles instead.
const DEFAULT_MAX_COMPACTIONS = 1;

/** The `create_artifact` executor for a send, or undefined when the tool isn't registered this turn. */
function resolveClientToolExecutor(sendOptions: ForwardedSendOptions) {
    return sendOptions.artifactToolMode && sendOptions.artifactToolMode !== 'off'
        ? createArtifactToolExecutor
        : undefined;
}

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
            messageMap,
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

        // This generation supersedes whatever the previous one left suspended for this conversation.
        clearSuspendedChain(conversationId);

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
                    messageMap,
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
            throwIfAborted(sendOptions.signal);
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
                    if (isAbortError(proactiveError)) {
                        throw proactiveError;
                    }
                    // Nothing to compact, or compaction failed: fall through and
                    // attempt the send as-is (the reactive path can still catch overflow).
                    if (!(proactiveError instanceof NotEnoughToCompactError)) {
                        console.warn('Proactive compaction failed; sending without it', proactiveError);
                    }
                }
            }
        }

        while (true) {
            throwIfAborted(sendOptions.signal);
            try {
                const turns = buildTurns(currentChain);
                const result = await dispatch(
                    sendMessageWithRedux(api, turns, {
                        ...sendOptions,
                        clientToolExecutor: resolveClientToolExecutor(sendOptions),
                        messageId: currentAssistantId,
                        conversationId,
                        spaceId,
                    })
                );
                // The tool loop ran out of rounds mid-task: park the chain so the conversation can
                // offer to carry on instead of ending the turn in silence.
                if (result?.stoppedOnBudget) {
                    dispatch(
                        suspendChain({
                            api,
                            conversationId,
                            spaceId,
                            messageId: currentAssistantId,
                            turns: result.turns,
                            sendOptions,
                        })
                    );
                }
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

/** A chain the round budget cut short, kept as everything a resume needs to pick it back up. */
type Suspension = {
    api: Api;
    conversationId: ConversationId;
    spaceId: SpaceId;
    messageId: MessageId;
    turns: Turn[];
    sendOptions: ForwardedSendOptions;
};

function suspendChain(suspension: Suspension) {
    return (dispatch: LumoDispatch): void => {
        setSuspendedChain({
            conversationId: suspension.conversationId,
            resume: () => dispatch(resumeChain(suspension)),
        });
    };
}

/**
 * Carry a suspended chain on. The saved turns are replayed as-is and the answer streams into the same
 * assistant message
 */
function resumeChain(suspension: Suspension) {
    return async (dispatch: LumoDispatch): Promise<void> => {
        const { api, conversationId, spaceId, messageId, turns, sendOptions } = suspension;

        // A resume is its own generation: it needs a live signal for the composer's stop button, and
        // the registry slot keeps a message sent in the meantime from racing it.
        let controller: AbortController;
        try {
            controller = generationRegistry.start(conversationId);
        } catch {
            return;
        }

        clearSuspendedChain(conversationId);
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.GENERATING }));

        try {
            const result = await dispatch(
                sendMessageWithRedux(api, turns, {
                    ...sendOptions,
                    // A chain suspended mid tool loop has to resume with the same client tools
                    // registered, or the model loses the artifact tool it was in the middle of using.
                    clientToolExecutor: resolveClientToolExecutor(sendOptions),
                    // The first attempt already settled the title; a resume only continues the answer.
                    generateTitle: false,
                    signal: controller.signal,
                    messageId,
                    conversationId,
                    spaceId,
                })
            );
            if (result?.stoppedOnBudget) {
                dispatch(suspendChain({ ...suspension, turns: result.turns }));
            }
        } catch (error) {
            console.warn('resume after tool-round budget failed', error);
            dispatch(suspendChain(suspension));
        } finally {
            generationRegistry.finish(conversationId);
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
    messageMap?: Record<MessageId, Message>;
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
            messageMap,
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
            result = await compactConversation(chain, api, { signal, attachments, contextFilters, messageMap });
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
