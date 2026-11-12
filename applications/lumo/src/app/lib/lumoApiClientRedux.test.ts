import { TransformStream } from 'stream/web';

import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import { ContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';
import { GenerationInterruptedError, newRecoveryState } from '@proton/lumo-api-client/core/recovery';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { appendChunk, finishMessage, pushMessageRequest } from '../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../redux/store';
import { extraThunkArguments } from '../redux/thunk';
import { generationRegistry } from '../services/generation/generationRegistry';
import {
    GenerationCheckpointError,
    discardGenerationRecovery,
    finalizeGenerationRecovery,
    persistGenerationCheckpoint,
    removeGenerationRecovery,
} from '../services/generation/recovery';
import { getTerminalTypeForApiError, sendMessageWithRedux } from './lumoApiClientRedux';

Object.assign(globalThis, { TransformStream });

describe('getTerminalTypeForApiError', () => {
    it('does not convert HTTP 429 responses into generic terminal errors', () => {
        expect(
            getTerminalTypeForApiError({
                status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
                data: {
                    error: {
                        code: 'error',
                        message: 'Too many requests. Please try again later.',
                    },
                },
            })
        ).toBeNull();
    });

    it('continues to detect terminal errors for other HTTP statuses', () => {
        expect(
            getTerminalTypeForApiError({
                status: HTTP_ERROR_CODES.SERVICE_UNAVAILABLE,
                data: {
                    error: {
                        code: 'rejected',
                        message: 'Request rejected due to high demand.',
                    },
                },
            })
        ).toBe('rejected');
    });
});

jest.mock('../services/generation/recovery', () => ({
    GenerationCheckpointError: jest.requireActual('../services/generation/recovery').GenerationCheckpointError,
    persistGenerationCheckpoint: jest.fn(),
    finalizeGenerationRecovery: jest.fn(),
    discardGenerationRecovery: jest.fn(),
    removeGenerationRecovery: jest.fn(),
}));

describe('generation recovery flag', () => {
    const originalUnleashClient = extraThunkArguments.unleashClient;
    const checkpoint = newRecoveryState([], 'message');

    afterEach(() => {
        extraThunkArguments.unleashClient = originalUnleashClient;
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it.each([
        { effectiveFlag: true, originalFlag: false },
        { effectiveFlag: false, originalFlag: true },
    ])(
        'uses the effective flag $effectiveFlag when the original client reports $originalFlag',
        async ({ effectiveFlag, originalFlag }) => {
            const originalFlagCheck = jest.fn().mockReturnValue(originalFlag);
            Object.assign(extraThunkArguments, { unleashClient: { isEnabled: originalFlagCheck } });
            jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, _turns, options) => {
                await options?.recovery?.checkpoint(checkpoint, null);
                return { status: 'succeeded', turns: [], producedTurns: [] };
            });
            const getState = jest.fn(() => ({ messages: {}, conversations: {} }) as unknown as LumoState);
            const result = await sendMessageWithRedux(jest.fn() as Api, [], {
                messageId: 'assistant',
                conversationId: 'conversation',
                spaceId: 'space',
                enableGenerationRecovery: effectiveFlag,
            })(jest.fn(), getState);

            expect(result).toEqual({ status: 'succeeded', turns: [], producedTurns: [] });
            expect(originalFlagCheck).not.toHaveBeenCalled();
            if (effectiveFlag) {
                expect(persistGenerationCheckpoint).toHaveBeenCalledWith(
                    expect.objectContaining({
                        checkpoint,
                        messageId: 'assistant',
                        conversationId: 'conversation',
                        spaceId: 'space',
                        getState,
                    })
                );
            } else {
                expect(persistGenerationCheckpoint).not.toHaveBeenCalled();
            }
        }
    );
});

describe('recovery checkpoints with batched rendering', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('flushes the last tokens and preserves tool settings before saving a checkpoint', async () => {
        const checkpoint = newRecoveryState([], 'message');
        const state = { conversations: {}, messages: { assistant: { content: '' } } } as unknown as LumoState;
        const dispatch = jest.fn((action) => {
            if (appendChunk.match(action)) {
                state.messages.assistant.content += action.payload.content;
            }
        }) as unknown as LumoDispatch;
        jest.mocked(persistGenerationCheckpoint).mockImplementationOnce(async (params) => {
            expect(params.getState().messages.assistant.content).toBe('last tokens');
            expect(params.options).toMatchObject({ artifactToolMode: 'create', enableCreateScheduleTool: true });
        });
        jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, _turns, options) => {
            await options?.chunkCallback?.({ type: 'token_data', target: 'message', count: 1, content: 'last tokens' });
            await options?.recovery?.checkpoint(checkpoint, null);
            return { status: 'succeeded', turns: [], producedTurns: [] };
        });
        await sendMessageWithRedux(jest.fn() as Api, [], {
            messageId: 'assistant',
            conversationId: 'conversation',
            spaceId: 'space',
            enableGenerationRecovery: true,
            artifactToolMode: 'create',
            enableCreateScheduleTool: true,
        })(dispatch, () => state);
        expect(persistGenerationCheckpoint).toHaveBeenCalledTimes(1);
        expect(state.messages.assistant.content).toBe('last tokens');
    });
});

describe('recovery during context overflow', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('finalizes and discards an overflow checkpoint without persisting the discarded attempt', async () => {
        const error = new ContextLengthExceededError({ conversationId: 'conversation' });
        const dispatch = jest.fn();
        jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, _turns, options) => {
            await options?.recovery?.checkpoint(newRecoveryState([], 'message'), null);
            await options?.finishCallback?.('failed');
            expect(finalizeGenerationRecovery).toHaveBeenCalledWith(
                'conversation',
                { messages: {}, conversations: {} },
                api
            );
            expect(dispatch.mock.calls.some(([action]) => pushMessageRequest.match(action))).toBe(false);
            throw error;
        });
        const api = jest.fn() as Api;

        await expect(
            sendMessageWithRedux(api, [], {
                messageId: 'assistant',
                conversationId: 'conversation',
                spaceId: 'space',
                enableGenerationRecovery: true,
            })(dispatch, () => ({ messages: {}, conversations: {} }) as LumoState)
        ).rejects.toBe(error);

        expect(discardGenerationRecovery).toHaveBeenCalledWith(api, 'conversation');
        expect(dispatch.mock.calls.some(([action]) => pushMessageRequest.match(action))).toBe(false);
    });

    it('retains the checkpoint and partial answer when the transport is interrupted', async () => {
        const error = new GenerationInterruptedError();
        const dispatch = jest.fn();
        jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockRejectedValue(error);

        await expect(
            sendMessageWithRedux(jest.fn() as Api, [], {
                messageId: 'assistant',
                conversationId: 'conversation',
                spaceId: 'space',
                enableGenerationRecovery: true,
            })(dispatch, () => ({ messages: {}, conversations: {} }) as LumoState)
        ).rejects.toBe(error);

        expect(discardGenerationRecovery).not.toHaveBeenCalled();
        expect(finalizeGenerationRecovery).not.toHaveBeenCalled();
        expect(dispatch.mock.calls.some(([action]) => pushMessageRequest.match(action))).toBe(false);
    });
});

it('keeps Ghost generations out of the replay transport even when recovery is enabled', async () => {
    const call = jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockResolvedValue({
        status: 'succeeded',
        turns: [],
        producedTurns: [],
    });
    try {
        await sendMessageWithRedux(jest.fn() as Api, [], {
            messageId: 'answer',
            conversationId: 'ghost',
            spaceId: 'space',
            enableGenerationRecovery: true,
        })(jest.fn(), () => ({ messages: {}, conversations: { ghost: { ghost: true } } }) as unknown as LumoState);
        expect(call).toHaveBeenCalledWith(
            expect.any(Function),
            [],
            expect.not.objectContaining({ recovery: expect.anything() })
        );
    } finally {
        jest.restoreAllMocks();
    }
});

const originalDatabase = extraThunkArguments.dbApi;
beforeEach(() => {
    extraThunkArguments.dbApi = {} as typeof originalDatabase;
    jest.spyOn(generationRegistry, 'canRecover').mockReturnValue(true);
});
afterEach(() => {
    extraThunkArguments.dbApi = originalDatabase;
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

it('uses ordinary streaming when browser ownership locks are unavailable', async () => {
    jest.spyOn(generationRegistry, 'canRecover').mockReturnValue(false);
    const call = jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockResolvedValue({
        status: 'succeeded',
        turns: [],
        producedTurns: [],
    });
    await sendMessageWithRedux(jest.fn() as Api, [], {
        messageId: 'answer',
        conversationId: 'chat',
        spaceId: 'space',
        enableGenerationRecovery: true,
    })(jest.fn(), () => ({ messages: {}, conversations: { chat: { ghost: false } } }) as unknown as LumoState);
    expect(call).toHaveBeenCalledWith(
        expect.any(Function),
        [],
        expect.not.objectContaining({ recovery: expect.anything() })
    );
});

it.each([
    ['storage quota', new DOMException('Storage full', 'QuotaExceededError')],
    ['missing attachment space', new Error('Recovery attachment has no owning space')],
    ['deleted attachment', new Error('Recovery attachment was deleted')],
    ['attachment decryption', new DOMException('Decryption failed', 'OperationError')],
    ['attachment serialization', new Error('Recovery attachment could not be encrypted')],
    ['unexpected checkpoint error', new Error('Unexpected failure')],
])('sends once with ordinary streaming if initial recovery fails: %s', async (_reason, cause) => {
    jest.mocked(persistGenerationCheckpoint).mockRejectedValueOnce(new GenerationCheckpointError(cause));
    const dispatch = jest.fn();
    const api = jest.fn().mockResolvedValue(
        new ReadableStream({
            start(controller) {
                controller.enqueue(
                    new TextEncoder().encode(
                        'data: {"choices":[{"index":0,"delta":{"content":"Ordinary answer"}}]}\n\ndata: [DONE]\n\n'
                    )
                );
                controller.close();
            },
        })
    ) as unknown as Api;
    const result = await sendMessageWithRedux(api, [], {
        config: { enableU2LEncryption: false, enableSmoothing: false },
        messageId: 'answer',
        conversationId: 'chat',
        spaceId: 'space',
        enableGenerationRecovery: true,
    })(dispatch, () => ({ messages: {}, conversations: { chat: {} } }) as unknown as LumoState);
    expect(result.status).toBe('succeeded');
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
            method: 'post',
            data: expect.objectContaining({
                lumo: expect.not.objectContaining({ resumable: true }),
            }),
        })
    );
    expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
            type: finishMessage.type,
            payload: expect.objectContaining({ content: 'Ordinary answer', status: 'succeeded' }),
        })
    );
    expect(persistGenerationCheckpoint).toHaveBeenCalledTimes(1);
    expect(finalizeGenerationRecovery).not.toHaveBeenCalled();
    expect(removeGenerationRecovery).toHaveBeenCalledWith('chat', expect.any(String));
});

it('reports errors outside checkpoint preparation without submitting a generation', async () => {
    const failure = new Error('Unexpected failure');
    jest.mocked(persistGenerationCheckpoint).mockRejectedValueOnce(failure);
    const api = jest.fn() as Api;
    const dispatch = jest.fn();
    await expect(
        sendMessageWithRedux(api, [], {
            config: { enableU2LEncryption: false },
            messageId: 'answer',
            conversationId: 'chat',
            spaceId: 'space',
            enableGenerationRecovery: true,
        })(dispatch, () => ({ messages: {}, conversations: { chat: {} } }) as unknown as LumoState)
    ).rejects.toBe(failure);
    expect(api).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: finishMessage.type, payload: expect.objectContaining({ status: 'failed' }) })
    );
});

it('enables guest recovery without browser ownership locks', async () => {
    Object.assign(extraThunkArguments, { dbApi: undefined });
    jest.spyOn(generationRegistry, 'canRecover').mockReturnValue(false);
    const call = jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockResolvedValue({
        status: 'succeeded',
        turns: [],
        producedTurns: [],
    });
    await sendMessageWithRedux(jest.fn() as Api, [], {
        messageId: 'answer',
        conversationId: 'guest-chat',
        spaceId: 'space',
        enableGenerationRecovery: true,
    })(jest.fn(), () => ({ messages: {}, conversations: { 'guest-chat': {} } }) as unknown as LumoState);
    expect(call).toHaveBeenCalledWith(
        expect.any(Function),
        [],
        expect.objectContaining({ recovery: { checkpoint: expect.any(Function), confirmToolRetry: undefined } })
    );
});

it('preserves the checkpoint and stops tool execution if attachment capture fails after the request', async () => {
    const failure = new GenerationCheckpointError(new Error('Recovery attachment was deleted'));
    jest.mocked(persistGenerationCheckpoint).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure);
    const execute = jest.fn(async () => [{ content: 'Action result' }]);
    const api = jest.fn().mockResolvedValue(
        new ReadableStream({
            start(controller) {
                controller.enqueue(
                    new TextEncoder().encode(
                        'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_action","function":{"name":"action","arguments":"{}"}}]}}]}\n\n' +
                            'data: {"choices":[{"index":0,"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n\n'
                    )
                );
                controller.close();
            },
        })
    ) as unknown as Api;
    await expect(
        sendMessageWithRedux(api, [], {
            config: { enableU2LEncryption: false, enableSmoothing: false },
            messageId: 'answer',
            conversationId: 'chat',
            spaceId: 'space',
            enableGenerationRecovery: true,
            clientTools: [{ type: 'function', function: { name: 'action', description: '', parameters: {} } }],
            clientToolExecutor: { canExecute: () => true, execute },
        })(jest.fn(), () => ({ messages: {}, conversations: { chat: {} } }) as unknown as LumoState)
    ).rejects.toBe(failure);
    expect(api).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
    expect(persistGenerationCheckpoint).toHaveBeenCalledTimes(2);
    expect(jest.mocked(persistGenerationCheckpoint).mock.calls[1][0].checkpoint).toMatchObject({
        phase: 'tool-pending',
        pendingCalls: [{ id: 'call_action', name: 'action', arguments: '{}' }],
    });
    expect(removeGenerationRecovery).not.toHaveBeenCalled();
    expect(discardGenerationRecovery).not.toHaveBeenCalled();
    expect(finalizeGenerationRecovery).not.toHaveBeenCalled();
});
