import { discardChatJob } from '@proton/lumo-api-client/core/network';
import { GenerationInterruptedError } from '@proton/lumo-api-client/core/recovery';
import type { GenerationRecoveryState } from '@proton/lumo-api-client/core/recovery';
import type { AssistantCallOptions, LumoApiClientConfig } from '@proton/lumo-api-client/core/types';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { ForwardedSendOptions } from '../../components/Conversation/compactionFlow';
import { captureRetrievalRecovery } from '../../features/client-tools/retrievalTool/recovery';
import type { RetrievalRecoveryState } from '../../features/client-tools/retrievalTool/recovery';
import { MAX_READ_CHARS_PER_REPLY } from '../../features/client-tools/retrievalTool/retrievalTool';
import {
    ANALYZE_FILE_TOOL_NAME,
    READ_KNOWLEDGE_TOOL_NAME,
    SEARCH_KNOWLEDGE_TOOL_NAME,
} from '../../features/client-tools/retrievalTool/schema';
import type { LumoState } from '../../redux/store';
import { extraThunkArguments } from '../../redux/thunk';
import type { Conversation, Message, Space } from '../../types';
import { generationRegistry } from './generationRegistry';
import { InMemoryGenerationRecoveryStore } from './inMemoryGenerationRecoveryStore';
import type { GenerationRecoveryStorage } from './inMemoryGenerationRecoveryStore';
import { RecoveryAttachmentWriter } from './recoveryAttachments';
import type { RecoveryAttachment } from './recoveryAttachments';

export class GenerationCheckpointError extends GenerationInterruptedError {
    constructor(readonly cause?: unknown) {
        super();
        this.name = 'GenerationCheckpointError';
    }
}

export interface RecoveryRecord {
    checkpoint: GenerationRecoveryState;
    requestId?: string;
    requestKey?: string;
    retrieval?: RetrievalRecoveryState;
    options: AssistantCallOptions &
        Pick<
            ForwardedSendOptions,
            | 'artifactToolMode'
            | 'artifactPresentationEnabled'
            | 'enableAskUserQuestionsTool'
            | 'enableCreateScheduleTool'
            | 'skillTools'
        >;
    config?: Partial<LumoApiClientConfig>;
    message: Message;
    conversation: Conversation;
    space: Space;
    ancestors: Message[];
    attachments: RecoveryAttachment[];
}

export function logGenerationRecoveryError(
    operation: 'checkpoint scan' | 'checkpoint read' | 'checkpoint restore' | 'checkpoint save' | 'cleanup' | 'resume',
    error: unknown
): void {
    const status =
        typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
            ? error.status
            : undefined;
    console.warn(`[Generation recovery] ${operation} failed`, {
        name: error instanceof Error ? error.name : 'UnknownError',
        status,
    });
}

const guestRecoveryStore = new InMemoryGenerationRecoveryStore();

export function generationRecoveryStore(): GenerationRecoveryStorage {
    return extraThunkArguments.dbApi?.recovery ?? guestRecoveryStore;
}

export async function getGenerationRecovery(conversationId: string): Promise<RecoveryRecord | undefined> {
    try {
        return await generationRecoveryStore().get<RecoveryRecord>(conversationId);
    } catch (error) {
        logGenerationRecoveryError('checkpoint read', error);
        return undefined;
    }
}

export async function removeGenerationRecovery(conversationId: string, jobId: string): Promise<void> {
    await generationRecoveryStore()
        .remove(conversationId, jobId)
        .catch((error) => logGenerationRecoveryError('cleanup', error));
}

async function saveGenerationRecoveryRecord(record: RecoveryRecord): Promise<void> {
    try {
        await generationRecoveryStore().save(
            record.conversation.id,
            record,
            record.checkpoint.createdAt + 3_600_000,
            record.checkpoint.jobId,
            record.attachments.map(({ attachment }) => attachment.id)
        );
    } catch (error) {
        logGenerationRecoveryError('checkpoint save', error);
        throw new GenerationCheckpointError(error);
    }
}

export async function persistGenerationCheckpoint(params: {
    checkpoint: GenerationRecoveryState;
    requestId?: string;
    requestKey?: string;
    options: ForwardedSendOptions;
    config?: Partial<LumoApiClientConfig>;
    messageId: string;
    conversationId: string;
    spaceId: string;
    getState: () => LumoState;
    attachmentWriter?: RecoveryAttachmentWriter;
}): Promise<void> {
    const state = params.getState();
    const { options, config } = params;
    const message = state.messages[params.messageId];
    const conversation = state.conversations[params.conversationId];
    const space = state.spaces[params.spaceId];
    if (!message || !conversation || !space) {
        throw new Error('Cannot save generation recovery without its conversation');
    }
    if (conversation.ghost) {
        await generationRecoveryStore().remove(conversation.id);
        return;
    }
    const ancestors = Object.values(state.messages).filter((item) => item.conversationId === conversation.id);
    const attachmentIds = new Set(
        ancestors.flatMap((item) => item.attachments?.map((attachment) => attachment.id) ?? [])
    );
    const retrieval = options.retrievalTools
        ? captureRetrievalRecovery(
              options.retrievalTools,
              options.getRetrievalExecutionState?.() ?? options.retrievalExecutionState
          )
        : undefined;
    if (retrieval && params.checkpoint.phase === 'tool-running') {
        // A crashed lookup may have finished; reserve its budget before any confirmed retry.
        for (const call of params.checkpoint.pendingCalls ?? []) {
            if (
                call.name === SEARCH_KNOWLEDGE_TOOL_NAME ||
                call.name === READ_KNOWLEDGE_TOOL_NAME ||
                call.name === ANALYZE_FILE_TOOL_NAME
            ) {
                retrieval.execution.calls += 1;
            }
            if (call.name === READ_KNOWLEDGE_TOOL_NAME) {
                retrieval.execution.reads += 1;
                // The interrupted read may have exhausted the remaining character budget.
                retrieval.execution.readChars = MAX_READ_CHARS_PER_REPLY;
            }
            if (call.name === ANALYZE_FILE_TOOL_NAME) {
                retrieval.execution.analyses = (retrieval.execution.analyses ?? 0) + 1;
            }
        }
    }
    const record: RecoveryRecord = {
        checkpoint: params.checkpoint,
        requestId: params.requestId,
        requestKey: params.requestKey,
        retrieval,
        message,
        conversation,
        space,
        ancestors,
        attachments: [],
        options: {
            enableExternalTools: options.enableExternalTools,
            enableImageTools: options.enableImageTools,
            enableReasoning: options.enableReasoning,
            modelTier: options.modelTier,
            imageAspectRatio: options.imageAspectRatio,
            responseFormat: options.responseFormat,
            clientTools: options.clientTools,
            serverTools: options.serverTools,
            enableDesktopTools: options.enableDesktopTools,
            artifactToolMode: options.artifactToolMode,
            artifactPresentationEnabled: options.artifactPresentationEnabled,
            enableAskUserQuestionsTool: options.enableAskUserQuestionsTool,
            enableCreateScheduleTool: options.enableCreateScheduleTool,
            skillTools: options.skillTools,
        },
        config: {
            enableU2LEncryption: config?.enableU2LEncryption ?? true,
            enableSmoothing: config?.enableSmoothing ?? true,
            ...(config?.externalTools ? { externalTools: config.externalTools } : {}),
        },
    };
    try {
        record.attachments = await (
            params.attachmentWriter ?? new RecoveryAttachmentWriter(extraThunkArguments.dbApi)
        ).capture(
            Object.values(state.attachments).filter((item) => attachmentIds.has(item.id)),
            state.spaces
        );
        await saveGenerationRecoveryRecord(record);
    } catch (error) {
        if (error instanceof GenerationCheckpointError) {
            throw error;
        }
        logGenerationRecoveryError('checkpoint save', error);
        throw new GenerationCheckpointError(error);
    }
}

export async function finalizeGenerationRecovery(
    conversationId: string,
    state: LumoState,
    api: Api
): Promise<RecoveryRecord | undefined> {
    const record = await getGenerationRecovery(conversationId);
    if (!record) {
        return;
    }
    record.checkpoint = { ...record.checkpoint, phase: 'completed', pendingCalls: undefined };
    record.message = state.messages[record.message.id] ?? record.message;
    record.conversation = state.conversations[conversationId] ?? record.conversation;
    record.ancestors = record.ancestors.map((message) => state.messages[message.id] ?? message);
    if (extraThunkArguments.dbApi) {
        await saveGenerationRecoveryRecord(record);
    } else {
        await removeGenerationRecovery(conversationId, record.checkpoint.jobId);
        void cancelGenerationJobs(api, record.checkpoint);
    }
    return record;
}

export async function discardGenerationRecovery(api: Api, conversationId: string): Promise<void> {
    const controller = generationRegistry.isInProgress(conversationId)
        ? undefined
        : await generationRegistry.startExclusive(conversationId);
    try {
        const record = await getGenerationRecovery(conversationId);
        if (!record) {
            return;
        }
        await removeGenerationRecovery(conversationId, record.checkpoint.jobId);
        await cancelGenerationJobs(api, record.checkpoint);
    } finally {
        if (controller !== undefined) {
            generationRegistry.finish(conversationId, controller);
        }
    }
}

export async function cancelGenerationJobs(api: Api, checkpoint: GenerationRecoveryState): Promise<void> {
    await Promise.all(
        [...(checkpoint.previousJobs ?? []), checkpoint].map(async (job) => {
            // Cancellation is best effort; expiry still bounds retention if the network is unavailable.
            await discardChatJob(api, { ...checkpoint, ...job }).catch((error) =>
                logGenerationRecoveryError('cleanup', error)
            );
        })
    );
}

export async function clearGenerationRecoveryOnLogout(): Promise<void> {
    generationRegistry.abortAll();
    await Promise.all([
        guestRecoveryStore.dispose().catch((error) => logGenerationRecoveryError('cleanup', error)),
        extraThunkArguments.dbApi?.recovery.dispose().catch((error) => logGenerationRecoveryError('cleanup', error)),
    ]);
}
