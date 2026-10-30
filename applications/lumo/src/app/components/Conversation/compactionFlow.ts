import { composeClientToolExecutors } from '@proton/lumo-api-client/core/client-tools';
import { isContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';
import { createDesktopClientToolExecutor, isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import type { AssistantCallOptions, ClientToolExecutor, LumoApiClientConfig } from '@proton/lumo-api-client/core/types';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { askUserQuestionsToolExecutor } from '../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import { createScheduleToolExecutor } from '../../features/client-tools/createScheduleTool/createScheduleTool';
import {
    type RetrievalContext,
    createRetrievalToolExecutor,
} from '../../features/client-tools/retrievalTool/retrievalTool';
import type { DesktopConnectorState } from '../../features/skills/connectorMatching';
import { createSkillToolExecutor } from '../../features/skills/skillTool';
import { loadSkillInstructions, readSkillFile } from '../../features/skills/skillsThunks';
import { sendMessageWithRedux } from '../../lib/lumoApiClientRedux';
import type { ContextFilter } from '../../llm';
import { compactConversation, estimateTurnsTokens } from '../../llm/compaction';
import { collapseCompactedChain } from '../../llm/compaction/collapse';
import { MIN_COMPACTION_TOKENS_RECLAIMED } from '../../llm/compaction/constants';
import { NotEnoughToCompactError } from '../../llm/compaction/partition';
import { estimateEffectiveContextUsage } from '../../llm/effectiveContextUsage';
import { type RequestBudget, resolveRequestBudget } from '../../llm/requestBudget';
import { countTokens } from '../../llm/tokenizer';
import { updateConversationStatus } from '../../redux/slices/core/conversations';
import {
    addMessage,
    createDate,
    deleteMessage,
    newMessageId,
    pushMessageRequest,
} from '../../redux/slices/core/messages';
import type { LumoDispatch } from '../../redux/store';
import { isAbortError, throwIfAborted } from '../../services/generation/abortGeneration';
import { waitForModels } from '../../services/modelsStore';
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
import { markArtifactTelemetryLiveMessage } from './artifact/artifactVersionTelemetry';
import { createArtifactToolExecutor } from './artifact/createArtifactTool';
import type { ArtifactToolMode } from './helper';

/** Options forwarded to sendMessageWithRedux, minus the per-attempt identifiers we manage here. */
type ForwardedSendOptions = AssistantCallOptions & {
    config?: Partial<LumoApiClientConfig>;
    generateTitle?: boolean;
    errorHandler?: (message: GenerationResponseMessage, conversationId: string) => any;
    /** Whether/how the `create_artifact` client tool is registered for this request. See `resolveArtifactToolMode`. */
    artifactToolMode?: ArtifactToolMode;
    /** Whether `create_artifact` offers `presentation` (slide decks, `LumoArtifactSlides`). */
    artifactPresentationEnabled?: boolean;
    /** Advertise the ask_user_questions tool only when its feature flag is enabled. */
    enableAskUserQuestionsTool?: boolean;
    /** Offer schedule drafts for review when schedules are enabled. */
    enableCreateScheduleTool?: boolean;
    /** Skills the model may load or read files from; each tool is only registered when it has skills. */
    skillTools?: SkillToolHandles;
    /** Registers search_knowledge and read_knowledge over this scope. */
    retrievalTools?: RetrievalContext;
};

export type SkillToolHandles = {
    /** Skills use_skill may load. */
    loadable: string[];
    /** Skills the user invoked whose files read_skill_file may also read. */
    readable: string[];
    /** Lumo Desktop's connectors, so a loaded skill learns which tools stand for its `~~placeholders`. */
    desktopConnectors?: DesktopConnectorState;
};

export type ConversationGenerationResult = {
    assistantMessageId: MessageId;
    status: 'succeeded' | 'failed';
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
    /**
     * Rebuilds turns for a (possibly compacted) chain. Must call prepareTurns under the hood,
     * resolving the request budget at call time so recalibration after an overflow applies.
     */
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
    /** Background runs must not replay a generation after a client tool may have acted. */
    retryAfterToolExecution?: boolean;
    /**
     * Compact pre-emptively when the planned request no longer fits the budget, instead of
     * waiting for the backend to reject it. Enabled by default.
     */
    enableProactiveCompaction?: boolean;
};

/**
 * One boundary before sending and one after a backend overflow, counted separately so a
 * proactive pass never uses up the reactive retry. More passes on the same request only
 * re-summarize an already condensed head; what is left over the budget is file content,
 * which the per-request file budget handles.
 */
const MAX_PROACTIVE_COMPACTIONS = 1;
const MAX_REACTIVE_COMPACTIONS = 1;
/** Retries after a backend overflow, with or without compaction. Each must plan a smaller request. */
const MAX_OVERFLOW_RETRIES = 2;
/** Bounded wait for model metadata so a send right after load uses the real window. */
const MODELS_WAIT_MS = 1_500;

/** Compactions in progress per conversation, so concurrent sends do not fold the same history twice. */
const compactionsInFlight = new Map<ConversationId, Promise<unknown>>();

/**
 * Client-side tools for a send. Artifact and Lumo Desktop connectors each have their own
 * {@link ClientToolExecutor}; compose them so enabling create_artifact does not replace desktop tools.
 */
function resolveClientToolExecutor(
    sendOptions: ForwardedSendOptions,
    dispatch: LumoDispatch,
    getVisibleMessageIds?: () => ReadonlySet<MessageId>
): ClientToolExecutor | undefined {
    const executors: ClientToolExecutor[] = [];

    if (sendOptions.enableCreateScheduleTool) {
        executors.push(createScheduleToolExecutor);
    }

    if (sendOptions.enableAskUserQuestionsTool) {
        executors.push(askUserQuestionsToolExecutor);
    }

    const { skillTools } = sendOptions;
    if (skillTools && (skillTools.loadable.length || skillTools.readable.length)) {
        executors.push(
            createSkillToolExecutor({
                loadableHandles: skillTools.loadable,
                readableHandles: skillTools.readable,
                loadSkill: (handle) =>
                    dispatch(
                        loadSkillInstructions({ handle, desktopConnectors: skillTools.desktopConnectors })
                    ).unwrap(),
                readFile: (handle, path) => dispatch(readSkillFile({ handle, path })).unwrap(),
            })
        );
    }

    if (sendOptions.retrievalTools) {
        executors.push(
            createRetrievalToolExecutor({
                ...sendOptions.retrievalTools,
                getVisibleMessageIds: getVisibleMessageIds ?? sendOptions.retrievalTools.getVisibleMessageIds,
            })
        );
    }

    if (sendOptions.artifactToolMode && sendOptions.artifactToolMode !== 'off') {
        executors.push(
            createArtifactToolExecutor({ presentationEnabled: sendOptions.artifactPresentationEnabled ?? false })
        );
    }

    if (sendOptions.clientToolExecutor) {
        executors.push(sendOptions.clientToolExecutor);
    } else if (sendOptions.enableDesktopTools !== false && isDesktopEnvironment()) {
        executors.push(createDesktopClientToolExecutor());
    }

    if (executors.length === 0) {
        return undefined;
    }

    return composeClientToolExecutors(...executors);
}

/** Client tool definitions travel with every request but are not part of the turns. */
async function estimateClientToolSchemaTokens(executor: ClientToolExecutor | undefined): Promise<number> {
    try {
        const tools = (await executor?.getClientTools?.()) ?? [];
        return tools.length > 0 ? countTokens(JSON.stringify(tools)) : 0;
    } catch {
        return 0;
    }
}

function newAssistantPlaceholder(conversationId: ConversationId, parentId: MessageId): Message {
    return {
        id: newMessageId(),
        parentId,
        conversationId,
        createdAt: createDate(),
        role: Role.Assistant,
        content: '',
        placeholder: true,
        blocks: [],
    };
}

/**
 * Run a generation, sized against the request budget and recovering from
 * `context_length_exceeded`.
 *
 * Before sending, a request that does not fit the budget (or that sheds files because
 * history crowds them out) is compacted: the compaction engine condenses older turns into
 * a compaction-boundary message (a new branch under the user question) and a fresh
 * assistant message under that boundary receives the generation. On a backend overflow the
 * budget is recalibrated from the overflow and the request is compacted or re-planned and
 * retried, as long as each retry is smaller. An attempt that overflowed is never persisted;
 * when nothing is left to try, the last attempt is persisted as failed (no compaction) or
 * discarded behind its persisted boundary, and the overflow error is surfaced.
 */
export function runGenerationWithCompaction(params: GenerationWithCompactionParams) {
    return async (dispatch: LumoDispatch): Promise<ConversationGenerationResult> => {
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
            retryAfterToolExecution = true,
            enableProactiveCompaction = true,
        } = params;

        let currentChain = chain;
        let currentAssistantId = assistantMessageId;
        let currentParentId = parentMessageId;
        let proactiveCompactions = 0;
        let reactiveCompactions = 0;
        let overflowRetries = 0;
        let toolExecutionStarted = false;
        // The lookup tools skip messages the request carries in full. Read from the chain being
        // sent, so messages a compaction in this send summarized away become searchable at once.
        let visibleFor: { chain: Message[]; ids: ReadonlySet<MessageId> } | undefined;
        const getVisibleMessageIds = () => {
            if (visibleFor?.chain !== currentChain) {
                const sent = collapseCompactedChain(currentChain, messageMap).chain;
                visibleFor = { chain: currentChain, ids: new Set(sent.map((message) => message.id)) };
            }
            return visibleFor.ids;
        };
        const resolvedExecutor = resolveClientToolExecutor(sendOptions, dispatch, getVisibleMessageIds);
        const clientToolExecutor = resolvedExecutor && {
            ...resolvedExecutor,
            execute: async (...args: Parameters<ClientToolExecutor['execute']>) => {
                toolExecutionStarted = true;
                return resolvedExecutor.execute(...args);
            },
        };

        await waitForModels(MODELS_WAIT_MS);
        const toolSchemaTokens = await estimateClientToolSchemaTokens(resolvedExecutor);
        const getBudget = (): RequestBudget =>
            resolveRequestBudget({
                modelTier: sendOptions.modelTier,
                reasoning: sendOptions.enableReasoning,
                conversationId,
            });
        const attachmentLookup = Object.fromEntries((attachments ?? []).map((a) => [a.id, a]));

        /** Estimated size of the request `buildTurns` produces for a chain, tool definitions included. */
        const estimateRequest = (candidate: Message[]): number => {
            try {
                return estimateTurnsTokens(buildTurns(candidate)) + toolSchemaTokens;
            } catch {
                return 0;
            }
        };

        /**
         * Compact when the planned request is over budget, or when it only fits by shedding or
         * excerpting files while there is enough history to make room for them.
         */
        const shouldCompact = (candidate: Message[]): boolean => {
            const budget = getBudget();
            if (estimateRequest(candidate) > budget.inputBudget) {
                return true;
            }
            try {
                const usage = estimateEffectiveContextUsage({
                    messageChain: candidate,
                    contextFilters: contextFilters ?? [],
                    allAttachments: attachmentLookup,
                    messageMap,
                    budget,
                    fileCards: !!sendOptions.retrievalTools,
                });
                const shedsFiles =
                    usage.droppedForBudget.length > 0 ||
                    usage.excerptedForBudget.size > 0 ||
                    [...usage.cardedFiles.values()].includes('budget');
                return shedsFiles && usage.conversationTokens + usage.toolCallTokens > budget.keepRecentTokens;
            } catch {
                return false;
            }
        };

        /** Run compaction, materialize the branch, and advance the local cursors. */
        const compactAndAdvance = async ({ skipIfBusy }: { skipIfBusy: boolean }): Promise<void> => {
            const inFlight = compactionsInFlight.get(conversationId);
            if (inFlight) {
                // Another send is already folding this history; this chain predates its boundary.
                if (skipIfBusy) {
                    throw new NotEnoughToCompactError();
                }
                await inFlight.catch(() => undefined);
            }
            const run = dispatch(
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
                    budget: getBudget(),
                    estimateRequest,
                })
            );
            compactionsInFlight.set(conversationId, run);
            let branch: Awaited<typeof run>;
            try {
                branch = await run;
            } finally {
                if (compactionsInFlight.get(conversationId) === run) {
                    compactionsInFlight.delete(conversationId);
                }
            }
            preferSibling?.(branch.boundary);
            currentChain = [...currentChain, branch.boundary];
            currentAssistantId = branch.assistant.id;
            currentParentId = branch.boundary.id;
        };

        /** Replace the overflowed attempt (never persisted) with a fresh one under the same parent. */
        const restartAttempt = () => {
            const assistant = newAssistantPlaceholder(conversationId, currentParentId);
            dispatch(deleteMessage(currentAssistantId));
            dispatch(addMessage(assistant));
            preferSibling?.(assistant);
            currentAssistantId = assistant.id;
        };

        /**
         * Stop retrying. An attempt that overflowed was not persisted. Without a compaction
         * boundary it is the question's only reply (a retry without compaction replaced the
         * original), so keep it as the failed turn; under a persisted boundary, drop it, since
         * the boundary already continues the branch.
         */
        const giveUp = (error: unknown): never => {
            dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
            if (currentParentId === parentMessageId) {
                dispatch(pushMessageRequest({ id: currentAssistantId }));
            } else {
                dispatch(deleteMessage(currentAssistantId));
            }
            throw error;
        };

        if (enableProactiveCompaction && proactiveCompactions < MAX_PROACTIVE_COMPACTIONS) {
            throwIfAborted(sendOptions.signal);
            if (shouldCompact(currentChain)) {
                try {
                    await compactAndAdvance({ skipIfBusy: true });
                    proactiveCompactions += 1;
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
            // Marked per attempt: compaction retries stream into a fresh assistant message.
            if (sendOptions.artifactToolMode && sendOptions.artifactToolMode !== 'off') {
                markArtifactTelemetryLiveMessage(currentAssistantId, {
                    artifactToolMode: sendOptions.artifactToolMode,
                });
            }
            const attemptEstimate = estimateRequest(currentChain);
            try {
                const turns = buildTurns(currentChain);
                const result = await dispatch(
                    sendMessageWithRedux(api, turns, {
                        ...sendOptions,
                        clientToolExecutor,
                        messageId: currentAssistantId,
                        conversationId,
                        spaceId,
                    })
                );
                return { assistantMessageId: currentAssistantId, status: result.status };
            } catch (error) {
                if (!isContextLengthExceededError(error)) {
                    throw error;
                }
                if ((!retryAfterToolExecution && toolExecutionStarted) || overflowRetries >= MAX_OVERFLOW_RETRIES) {
                    giveUp(error);
                }
                overflowRetries += 1;

                // The overflow already recalibrated the budget, so both paths below plan smaller.
                let compacted = false;
                if (reactiveCompactions < MAX_REACTIVE_COMPACTIONS) {
                    try {
                        await compactAndAdvance({ skipIfBusy: false });
                        reactiveCompactions += 1;
                        compacted = true;
                    } catch (compactionError) {
                        if (isAbortError(compactionError) || !(compactionError instanceof NotEnoughToCompactError)) {
                            giveUp(compactionError);
                        }
                    }
                }
                if (!compacted) {
                    if (estimateRequest(currentChain) >= attemptEstimate) {
                        giveUp(error);
                    }
                    restartAttempt();
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
    messageMap?: Record<MessageId, Message>;
    signal?: AbortSignal;
    /** Pins a sibling so the in-progress boundary is shown while compaction runs. */
    preferSibling?: (message: Message) => void;
    budget: RequestBudget;
    /** Estimated request size for a chain, used to report and require a real reduction. */
    estimateRequest: (chain: Message[]) => number;
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
 * step — can take a while), then filled in once the summary is ready. The boundary
 * is only kept when the next request actually shrinks by at least
 * `MIN_COMPACTION_TOKENS_RECLAIMED`; its reported saving is that reduction. The failed
 * attempt is only discarded on success; if compaction fails or frees nothing we remove
 * the placeholder boundary and re-pin the original attempt.
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
            budget,
            estimateRequest,
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

        const revert = () => {
            dispatch(deleteMessage(boundaryId));
            preferSibling?.({ id: failedAssistantId } as Message);
        };

        let boundary: Message;
        try {
            const result = await compactConversation(chain, api, {
                signal,
                attachments,
                contextFilters,
                messageMap,
                targetTokens: budget.compactionTargetTokens,
                keepRecentTokenBudget: budget.keepRecentTokens,
            });

            const compaction: CompactionMeta = {
                status: 'done',
                summary: result.summary,
                summarizedMessageIds: result.summarizedMessageIds,
                keptMessageIds: result.keptMessageIds,
                stats: result.stats,
                createdAt: now,
            };
            boundary = { ...inProgressBoundary, compaction };

            // What the next request actually loses, files and deduplication included.
            const reclaimed = estimateRequest(chain) - estimateRequest([...chain, boundary]);
            if (reclaimed < MIN_COMPACTION_TOKENS_RECLAIMED) {
                throw new NotEnoughToCompactError();
            }
            compaction.stats = { ...result.stats, tokensRemoved: reclaimed };
        } catch (error) {
            revert();
            throw error;
        }

        // Discard the failed attempt from the active branch (full history is preserved
        // via the original messages, which are still summarized into the boundary).
        dispatch(deleteMessage(failedAssistantId));

        dispatch(addMessage(boundary));
        dispatch(pushMessageRequest({ id: boundary.id }));

        const assistant = newAssistantPlaceholder(conversationId, boundary.id);
        dispatch(addMessage(assistant));

        return { boundary, assistant };
    };
}
