import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import { ToolRetryConfirmationRequiredError, newRecoveryState } from '@proton/lumo-api-client/core/recovery';

import { MAX_READ_CHARS_PER_REPLY } from '../../features/client-tools/retrievalTool/retrievalTool';
import {
    ANALYZE_FILE_TOOL_NAME,
    READ_KNOWLEDGE_TOOL_NAME,
    SEARCH_KNOWLEDGE_TOOL_NAME,
} from '../../features/client-tools/retrievalTool/schema';
import { GenerationRecoveryDb } from '../../indexedDb/generationRecoveryDb';
import type { LumoState } from '../../redux/store';
import { extraThunkArguments } from '../../redux/thunk';
import { generationRegistry } from './generationRegistry';
import {
    GenerationCheckpointError,
    discardGenerationRecovery,
    finalizeGenerationRecovery,
    getGenerationRecovery,
    logGenerationRecoveryError,
    persistGenerationCheckpoint,
    removeGenerationRecovery,
} from './recovery';
import type { RecoveryRecord } from './recovery';

const originalDatabase = extraThunkArguments.dbApi;
beforeEach(() => {
    extraThunkArguments.dbApi = {
        recovery: new GenerationRecoveryDb('recovery-service-test'),
    } as typeof originalDatabase;
});
afterEach(() => {
    extraThunkArguments.dbApi = originalDatabase;
});

it('persists retrieval metadata and conservatively counts uncertain lookups without saving runtime callbacks', async () => {
    const save = jest.spyOn(GenerationRecoveryDb.prototype, 'save').mockResolvedValue(undefined);
    const checkpoint = {
        ...newRecoveryState([], 'message'),
        phase: 'tool-running' as const,
        pendingCalls: [
            { id: 'read', name: READ_KNOWLEDGE_TOOL_NAME, arguments: '{}' },
            { id: 'search', name: SEARCH_KNOWLEDGE_TOOL_NAME, arguments: '{}' },
            { id: 'analysis', name: ANALYZE_FILE_TOOL_NAME, arguments: '{}' },
            { id: 'other', name: 'another_tool', arguments: '{}' },
        ],
    };
    const state = {
        messages: { answer: { id: 'answer', conversationId: 'conversation', content: 'Private answer' } },
        conversations: { conversation: { id: 'conversation' } },
        spaces: { space: { id: 'space' } },
        attachments: {},
    } as unknown as LumoState;
    const getRetrievalExecutionState = jest.fn(() => ({ calls: 2, reads: 1 }));
    try {
        await persistGenerationCheckpoint({
            checkpoint,
            options: {
                retrievalTools: {
                    conversationId: 'conversation',
                    spaceId: 'space',
                    isProject: false,
                    allowsSearchFromOutside: () => false,
                    allowWideScopes: false,
                    chatSearch: 'none',
                    searchOtherSpaces: false,
                    hasLumoPlus: false,
                    chatAttachments: [],
                    getState: () => state,
                    getVisibleMessageIds: () => new Set(['question']),
                    exclusions: { attachmentIds: new Set(['excluded']), documentIds: new Set(['document']) },
                },
                getRetrievalExecutionState,
            },
            messageId: 'answer',
            conversationId: 'conversation',
            spaceId: 'space',
            getState: () => state,
        });
        const stored = save.mock.calls[0][1] as RecoveryRecord;
        expect(stored.retrieval).toMatchObject({
            visibleMessageIds: ['question'],
            excludedAttachmentIds: ['excluded'],
            excludedDocumentIds: ['document'],
            execution: { calls: 5, reads: 2, analyses: 1, readChars: MAX_READ_CHARS_PER_REPLY },
        });
        expect(JSON.parse(JSON.stringify(stored.retrieval))).toEqual(stored.retrieval);
        expect(stored.options).not.toHaveProperty('retrievalTools');
        expect(stored.options).not.toHaveProperty('getRetrievalExecutionState');
        expect(getRetrievalExecutionState).toHaveBeenCalledTimes(1);
    } finally {
        jest.restoreAllMocks();
    }
});

describe('generation recovery diagnostics', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reports the operation and HTTP status without logging error contents or credentials', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const error = Object.assign(new Error('private prompt and resume token'), {
            status: 503,
            token: 'private token',
            requestKey: 'private key',
        });

        logGenerationRecoveryError('resume', error);

        expect(warn).toHaveBeenCalledWith('[Generation recovery] resume failed', { name: 'Error', status: 503 });
    });

    it('handles non-Error rejection values without logging their contents', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        logGenerationRecoveryError('checkpoint scan', 'private checkpoint');

        expect(warn).toHaveBeenCalledWith('[Generation recovery] checkpoint scan failed', {
            name: 'UnknownError',
            status: undefined,
        });
    });
});

describe('unavailable recovery storage', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('interrupts generation when a checkpoint cannot be written', async () => {
        const failure = new DOMException('Storage is full', 'QuotaExceededError');
        const save = jest.spyOn(GenerationRecoveryDb.prototype, 'save').mockRejectedValue(failure);
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const checkpoint = newRecoveryState([], 'message');
        const state = {
            messages: { answer: { id: 'answer', conversationId: 'conversation', content: 'Private answer' } },
            conversations: { conversation: { id: 'conversation' } },
            spaces: { space: { id: 'space' } },
            attachments: {},
        } as unknown as LumoState;
        await expect(
            persistGenerationCheckpoint({
                checkpoint,
                options: {},
                messageId: 'answer',
                conversationId: 'conversation',
                spaceId: 'space',
                getState: () => state,
            })
        ).rejects.toBeInstanceOf(GenerationCheckpointError);
        expect(save).toHaveBeenCalledWith(
            'conversation',
            expect.objectContaining({
                message: state.messages.answer,
                checkpoint,
            }),
            checkpoint.createdAt + 3_600_000,
            checkpoint.jobId,
            []
        );
        expect(warn).toHaveBeenCalledWith('[Generation recovery] checkpoint save failed', {
            name: 'QuotaExceededError',
            status: undefined,
        });
    });

    it('allows encrypted-message persistence and finalization when checkpoints cannot be read', async () => {
        jest.spyOn(GenerationRecoveryDb.prototype, 'get').mockRejectedValue(new Error('Storage blocked'));
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        await expect(getGenerationRecovery('conversation')).resolves.toBeUndefined();
        await expect(finalizeGenerationRecovery('conversation', {} as LumoState, jest.fn())).resolves.toBeUndefined();
    });

    it('does not turn a successful message save into a failure when local cleanup fails', async () => {
        const remove = jest
            .spyOn(GenerationRecoveryDb.prototype, 'remove')
            .mockRejectedValue(new Error('Storage blocked'));
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        await expect(removeGenerationRecovery('conversation', 'job')).resolves.toBeUndefined();
        expect(remove).toHaveBeenCalledWith('conversation', 'job');
        expect(warn).toHaveBeenCalledWith('[Generation recovery] cleanup failed', { name: 'Error', status: undefined });
    });
});

it('removes legacy Ghost checkpoints without saving Ghost contents', async () => {
    const remove = jest.spyOn(GenerationRecoveryDb.prototype, 'remove').mockResolvedValue(undefined);
    const save = jest.spyOn(GenerationRecoveryDb.prototype, 'save');
    const state = {
        messages: { answer: { id: 'answer', conversationId: 'ghost', content: 'Private answer' } },
        conversations: { ghost: { id: 'ghost', ghost: true } },
        spaces: { space: { id: 'space' } },
        attachments: {},
    } as unknown as LumoState;
    try {
        await persistGenerationCheckpoint({
            checkpoint: newRecoveryState([], 'message'),
            options: {},
            messageId: 'answer',
            conversationId: 'ghost',
            spaceId: 'space',
            getState: () => state,
        });
        expect(remove).toHaveBeenCalledWith('ghost');
        expect(save).not.toHaveBeenCalled();
    } finally {
        jest.restoreAllMocks();
    }
});

it.each(['tool-running', 'ready'] as const)(
    'preserves the last durable tool state when saving %s fails',
    async (failedPhase) => {
        let saved: RecoveryRecord | undefined;
        const failure = new DOMException('Storage is full', 'QuotaExceededError');
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(GenerationRecoveryDb.prototype, 'save').mockImplementation(async (_id, value) => {
            const record = value as RecoveryRecord;
            if (record.checkpoint.phase === failedPhase) {
                throw failure;
            }
            saved = structuredClone(record);
        });
        const state = {
            messages: { answer: { id: 'answer', conversationId: 'conversation' } },
            conversations: { conversation: { id: 'conversation' } },
            spaces: { space: { id: 'space' } },
            attachments: {},
        } as unknown as LumoState;
        const checkpoint = async (checkpoint: RecoveryRecord['checkpoint']) => {
            await persistGenerationCheckpoint({
                checkpoint,
                options: {},
                messageId: 'answer',
                conversationId: 'conversation',
                spaceId: 'space',
                getState: () => state,
            });
        };
        const initial = {
            ...newRecoveryState([], 'message'),
            phase: 'tool-pending' as const,
            pendingCalls: [{ id: 'action', name: 'action', arguments: '{}' }],
        };
        const execute = jest.fn(async () => [{ content: 'Action result' }]);
        const confirmToolRetry = jest.fn(async () => false);
        const finishCallback = jest.fn();
        const api = jest.fn();
        const client = new LumoApiClient({ enableU2LEncryption: false });
        const options = {
            recovery: { checkpoint, confirmToolRetry },
            clientToolExecutor: { canExecute: () => true, execute },
            finishCallback,
        };
        try {
            await checkpoint(initial);
            await expect(client.callAssistant(api, [], { ...options, resume: initial })).rejects.toBeInstanceOf(
                GenerationCheckpointError
            );
            expect(saved?.checkpoint.phase).toBe(failedPhase === 'ready' ? 'tool-running' : 'tool-pending');
            expect(saved?.checkpoint.pendingCalls).toEqual(initial.pendingCalls);
            await expect(
                client.callAssistant(api, [], { ...options, resume: saved?.checkpoint })
            ).rejects.toBeInstanceOf(
                failedPhase === 'ready' ? ToolRetryConfirmationRequiredError : GenerationCheckpointError
            );
            expect(execute).toHaveBeenCalledTimes(failedPhase === 'ready' ? 1 : 0);
            if (failedPhase === 'ready') {
                expect(execute).toHaveBeenCalledWith(initial.pendingCalls);
                expect(confirmToolRetry).toHaveBeenCalledTimes(1);
            } else {
                expect(confirmToolRetry).not.toHaveBeenCalled();
            }
            expect(finishCallback).not.toHaveBeenCalled();
            expect(api).not.toHaveBeenCalled();
        } finally {
            jest.restoreAllMocks();
        }
    }
);

it('does not delete or cancel a checkpoint owned by another tab', async () => {
    const read = jest.spyOn(GenerationRecoveryDb.prototype, 'get');
    const remove = jest.spyOn(GenerationRecoveryDb.prototype, 'remove');
    const api = jest.fn();
    const busy = new Error('Another operation is already in progress');
    jest.spyOn(generationRegistry, 'startExclusive').mockRejectedValueOnce(busy);
    try {
        await expect(discardGenerationRecovery(api, 'other-tab')).rejects.toBe(busy);
        expect(read).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
        expect(api).not.toHaveBeenCalled();
    } finally {
        jest.restoreAllMocks();
    }
});

it('keeps guest checkpoints and request keys in memory and cleans them up on completion', async () => {
    Object.assign(extraThunkArguments, { dbApi: undefined });
    const open = jest.spyOn(indexedDB, 'open');
    const write = jest.spyOn(Storage.prototype, 'setItem');
    const state = {
        messages: { answer: { id: 'answer', conversationId: 'guest-chat', content: 'Private answer' } },
        conversations: { 'guest-chat': { id: 'guest-chat' } },
        spaces: { space: { id: 'space' } },
        attachments: {},
    } as unknown as LumoState;
    const checkpoint = newRecoveryState([], 'message');
    const api = jest.fn().mockResolvedValue(undefined);
    try {
        await persistGenerationCheckpoint({
            checkpoint,
            requestId: 'guest-request',
            requestKey: 'guest request key kept only in memory',
            options: {},
            messageId: 'answer',
            conversationId: 'guest-chat',
            spaceId: 'space',
            getState: () => state,
        });
        expect(await getGenerationRecovery('guest-chat')).toMatchObject({
            requestId: 'guest-request',
            requestKey: 'guest request key kept only in memory',
            checkpoint,
            message: state.messages.answer,
        });
        expect(await finalizeGenerationRecovery('guest-chat', state, api)).toMatchObject({
            checkpoint: { phase: 'completed', jobId: checkpoint.jobId },
            message: state.messages.answer,
        });
        expect(await getGenerationRecovery('guest-chat')).toBeUndefined();
        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'delete',
                url: `ai/v1/jobs/${checkpoint.jobId}`,
                headers: { 'x-lumo-resume-token': checkpoint.token },
            })
        );
        expect(open).not.toHaveBeenCalled();
        expect(write).not.toHaveBeenCalled();
    } finally {
        jest.restoreAllMocks();
    }
});
