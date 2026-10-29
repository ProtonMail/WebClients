import { composeClientToolExecutors } from '@proton/lumo-api-client/core/client-tools';
import { isContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';
import { createDesktopClientToolExecutor, isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import type { AssistantCallOptions, ClientToolExecutor, LumoApiClientConfig } from '@proton/lumo-api-client/core/types';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { askUserQuestionsToolExecutor } from '../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import { createScheduleToolExecutor } from '../../features/client-tools/createScheduleTool/createScheduleTool';
import type { DesktopConnectorState } from '../../features/skills/connectorMatching';
import { createSkillToolExecutor } from '../../features/skills/skillTool';
import { loadSkillInstructions, readSkillFile } from '../../features/skills/skillsThunks';
import { sendMessageWithRedux } from '../../lib/lumoApiClientRedux';
import type { ContextFilter } from '../../llm';
import { compactConversation, estimateTurnsTokens } from '../../llm/compaction';
import { NotEnoughToCompactError } from '../../llm/compaction/partition';
import { getContextWindowConfigForModelTier } from '../../llm/modelContextLimits';
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
    /** Background runs must not replay a generation after a client tool may have acted. */
    retryAfterToolExecution?: boolean;
    /**
     * Compact pre-emptively when the estimated request size already exceeds the
     * threshold, instead of waiting for the backend to reject it. Enabled by default.
     */
    enableProactiveCompaction?: boolean;
    /** Estimated-token threshold that triggers proactive compaction. */
    proactiveThresholdTokens?: number;
    /** Compaction engine target size for the summarized region. */
    compactionTargetTokens?: number;
};

// One boundary per send. A second pass on the same request only re-summarizes an
// already-condensed head — it stacks another marker in the UI without freeing
// meaningful space, because what remains over the limit is file content, which the
// per-request file budget handles instead.
const DEFAULT_MAX_COMPACTIONS = 1;

/**
 * Client-side tools for a send. Artifact and Lumo Desktop connectors each have their own
 * {@link ClientToolExecutor}; compose them so enabling create_artifact does not replace desktop tools.
 */
function resolveClientToolExecutor(
    sendOptions: ForwardedSendOptions,
    dispatch: LumoDispatch
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
            maxCompactions = DEFAULT_MAX_COMPACTIONS,
            retryAfterToolExecution = true,
            enableProactiveCompaction = true,
            proactiveThresholdTokens: proactiveThresholdTokensParam,
            compactionTargetTokens: compactionTargetTokensParam,
        } = params;

        const windowConfig = getContextWindowConfigForModelTier(sendOptions.modelTier ?? 'auto');
        const proactiveThresholdTokens =
            proactiveThresholdTokensParam ?? windowConfig.proactiveCompactionThresholdTokens;
        const compactionTargetTokens = compactionTargetTokensParam ?? windowConfig.compactionTargetTokens;

        let currentChain = chain;
        let currentAssistantId = assistantMessageId;
        let currentParentId = parentMessageId;
        let compactions = 0;
        let toolExecutionStarted = false;
        const resolvedExecutor = resolveClientToolExecutor(sendOptions, dispatch);
        const clientToolExecutor = resolvedExecutor && {
            ...resolvedExecutor,
            execute: async (...args: Parameters<ClientToolExecutor['execute']>) => {
                toolExecutionStarted = true;
                return resolvedExecutor.execute(...args);
            },
        };

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
                    compactionTargetTokens,
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
            // Marked per attempt: compaction retries stream into a fresh assistant message.
            if (sendOptions.artifactToolMode && sendOptions.artifactToolMode !== 'off') {
                markArtifactTelemetryLiveMessage(currentAssistantId, {
                    artifactToolMode: sendOptions.artifactToolMode,
                });
            }
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
                if (
                    !isContextLengthExceededError(error) ||
                    compactions >= maxCompactions ||
                    (!retryAfterToolExecution && toolExecutionStarted)
                ) {
                    throw error;
                }

                try {
                    await compactAndAdvance();
                } catch (compactionError) {
                    dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
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
    messageMap?: Record<MessageId, Message>;
    signal?: AbortSignal;
    /** Pins a sibling so the in-progress boundary is shown while compaction runs. */
    preferSibling?: (message: Message) => void;
    compactionTargetTokens: number;
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
            compactionTargetTokens,
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
            result = await compactConversation(chain, api, {
                signal,
                attachments,
                contextFilters,
                messageMap,
                targetTokens: compactionTargetTokens,
            });
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
