import type { Api } from '@proton/shared/lib/interfaces';

import type { ChatCompletionsRequest } from '../types-api';
import { LumoApiClient, MAX_CLIENT_TOOL_ROUNDS } from './client';
import type { ClientToolExecutor, ClientToolResult } from './client-tools';
import { encryptTurns } from './encryption';
import { RequestEncryptionParams } from './encryptionParams';
import { callChatEndpoint } from './network';
import { type EncryptedTurn, Role, type Turn } from './types';

jest.mock('uuid', () => ({ v4: () => 'request-id' }));
jest.mock('./encryption', () => ({ DEFAULT_LUMO_PUB_KEY: 'pub-key', encryptTurns: jest.fn() }));
jest.mock('./encryptionParams', () => ({ RequestEncryptionParams: { create: jest.fn() } }));
jest.mock('./transforms/decrypt', () => ({
    decryptToolCallArguments: async (calls: unknown) => calls,
    makeDecryptionTransformStream: () => new TransformStream(),
}));

jest.mock('./network', () => ({
    LUMO_CHAT_ENDPOINT: 'ai/v1/chat/completions',
    callChatEndpoint: jest.fn(),
}));

const mockedCallChatEndpoint = callChatEndpoint as jest.MockedFunction<typeof callChatEndpoint>;
const mockedEncryptTurns = encryptTurns as jest.MockedFunction<typeof encryptTurns>;
const mockedCreateEncryption = RequestEncryptionParams.create as jest.MockedFunction<
    typeof RequestEncryptionParams.create
>;

const enableFakeEncryption = () => {
    mockedCreateEncryption.mockResolvedValue({
        requestId: 'request-id',
        encryptRequestKey: async () => 'wrapped-request-key',
    } as unknown as RequestEncryptionParams);
    mockedEncryptTurns.mockImplementation(async (turns: Turn[]) =>
        turns.map((turn): EncryptedTurn => ({ ...turn, content: `enc:${turn.content}`, encrypted: true }))
    );
};

const sse = (payload: object): string => `data: ${JSON.stringify(payload)}\n\n`;

const stream = (body: string): ReadableStream =>
    new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(body));
            controller.close();
        },
    });

const toolCallResponse = (name: string, narration = ''): ReadableStream =>
    stream(
        (narration ? sse({ choices: [{ index: 0, delta: { content: narration } }] }) : '') +
            sse({
                choices: [
                    {
                        index: 0,
                        delta: { tool_calls: [{ index: 0, id: `call_${name}`, function: { name, arguments: '{}' } }] },
                    },
                ],
            }) +
            sse({ choices: [{ index: 0, finish_reason: 'tool_calls' }] }) +
            'data: [DONE]\n\n'
    );

const proseResponse = (text: string): ReadableStream =>
    stream(sse({ choices: [{ index: 0, delta: { content: text } }] }) + 'data: [DONE]\n\n');

/** Executor whose every call succeeds. */
const executor: ClientToolExecutor = {
    canExecute: () => true,
    execute: async (calls): Promise<ClientToolResult[]> => calls.map((call) => ({ content: `ran ${call.name}` })),
};

const sentRequests = (): ChatCompletionsRequest[] =>
    mockedCallChatEndpoint.mock.calls.map(([, payload]) => payload as ChatCompletionsRequest);

const api = (() => {}) as unknown as Api;
const userTurns = [{ role: 'user' as any, content: 'find my festival tickets' }];
const searchTool = { type: 'function' as const, function: { name: 'search', description: '', parameters: {} } };

/** The model calls a tool for `toolRounds` generations, then answers. */
const callsToolsFor = (toolRounds: number, narration = '') => {
    let generations = 0;
    mockedCallChatEndpoint.mockImplementation(async () => {
        generations += 1;
        return generations <= toolRounds ? toolCallResponse('search', narration) : proseResponse('Here it is.');
    });
};

const newClient = () => new LumoApiClient({ enableU2LEncryption: false, enableSmoothing: false });

beforeEach(() => {
    mockedCallChatEndpoint.mockReset();
    mockedCreateEncryption.mockResolvedValue(null);
    mockedEncryptTurns.mockImplementation(async (turns) => turns as EncryptedTurn[]);
});

describe('callAssistant client tool rounds', () => {
    it('keeps running tool rounds until the model stops calling tools', async () => {
        callsToolsFor(25);

        const { status } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: executor,
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(26);
        expect(status).toBe('succeeded');
    });

    it('stops a model that never stops calling tools at the round ceiling', async () => {
        callsToolsFor(Infinity);

        const { status } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: executor,
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(MAX_CLIENT_TOOL_ROUNDS);
        expect(status).toBe('succeeded');
    });

    it('returns the chain it got through, client-tool exchanges included', async () => {
        callsToolsFor(3);

        const { turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: executor,
            clientTools: [searchTool],
        });

        expect(turns.filter((turn) => turn.content === 'ran search')).toHaveLength(3);
        expect(turns[0]).toEqual(userTurns[0]);
    });

    it('carries what the model said between tool calls into the chain', async () => {
        callsToolsFor(3, 'Looking now.');

        const { turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: executor,
            clientTools: [searchTool],
        });

        expect(turns.filter((turn) => turn.content === 'Looking now.')).toHaveLength(3);
        expect(turns[turns.length - 1]).toEqual({ role: Role.Assistant, content: '' });
    });

    it('sends a single request when there is no executor to run the calls', async () => {
        callsToolsFor(Infinity);

        await newClient().callAssistant(api, userTurns, { clientTools: [searchTool] });

        expect(sentRequests()).toHaveLength(1);
    });

    it('reports a missing tool result to the model instead of failing the whole turn', async () => {
        callsToolsFor(1);

        const { status, turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: { canExecute: () => true, execute: async () => [] },
            clientTools: [searchTool],
        });

        expect(status).toBe('succeeded');
        expect(turns.some((turn) => turn.content?.includes('The search tool returned no result'))).toBe(true);
    });

    it('does not start another round when the user stops it mid-tool', async () => {
        callsToolsFor(Infinity);
        const controller = new AbortController();
        let executions = 0;

        const call = newClient().callAssistant(api, userTurns, {
            clientToolExecutor: {
                canExecute: () => true,
                execute: async (calls) => {
                    executions += 1;
                    if (executions === 3) {
                        controller.abort();
                    }
                    return calls.map((c) => ({ content: `ran ${c.name}` }));
                },
            },
            clientTools: [searchTool],
            signal: controller.signal,
        });

        await expect(call).resolves.toMatchObject({ status: 'succeeded' });
        expect(executions).toBe(3);
        expect(sentRequests()).toHaveLength(3);
    });
});

describe('callAssistant recordRequestCallback', () => {
    it('receives the request as it was before encryption, while the wire request stays encrypted', async () => {
        enableFakeEncryption();
        mockedCallChatEndpoint.mockImplementation(async () => proseResponse('Here it is.'));
        const recordRequestCallback = jest.fn();

        await newClient().callAssistant(api, userTurns, {
            clientTools: [searchTool],
            modelTier: 'lumo-max',
            recordRequestCallback,
        });

        expect(recordRequestCallback).toHaveBeenCalledTimes(1);
        const [plaintext] = recordRequestCallback.mock.calls[0] as [ChatCompletionsRequest];
        expect(plaintext.messages[0]).toEqual({ role: 'user', content: 'find my festival tickets' });
        expect(plaintext.model).toBe('lumo-max');
        expect(plaintext.tools).toContainEqual(searchTool);
        expect(plaintext.lumo?.request_key).toBeUndefined();
        expect(plaintext.lumo?.request_id).toBeUndefined();

        const [sent] = sentRequests();
        expect(sent.messages[0]).toEqual({ role: 'user', content: 'enc:find my festival tickets', encrypted: true });
        expect(sent.lumo?.request_key).toBe('wrapped-request-key');
    });

    it('fires once per round, the last one carrying the tool results', async () => {
        callsToolsFor(3);
        const recordRequestCallback = jest.fn();

        await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: executor,
            clientTools: [searchTool],
            recordRequestCallback,
        });

        expect(recordRequestCallback).toHaveBeenCalledTimes(4);
        const [last] = recordRequestCallback.mock.calls.at(-1) as [ChatCompletionsRequest];
        expect(last.messages.filter((message) => message.content === 'ran search')).toHaveLength(3);
    });

    it('fires before sending, so a failed generation is still recorded', async () => {
        mockedCallChatEndpoint.mockRejectedValue(new Error('network down'));
        const recordRequestCallback = jest.fn();

        await expect(newClient().callAssistant(api, userTurns, { recordRequestCallback })).rejects.toThrow(
            'network down'
        );

        expect(recordRequestCallback).toHaveBeenCalledTimes(1);
    });
});

describe('callAssistant abort', () => {
    const longReply = sse({ choices: [{ index: 0, delta: { content: 'word '.repeat(200) } }] });

    const stillSending = (body: string): ReadableStream =>
        new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(body));
            },
        });

    const tokensAfterAbortOnFirst = async () => {
        const controller = new AbortController();
        const tokensAfterAbort: string[] = [];
        await new LumoApiClient({ enableU2LEncryption: false, enableSmoothing: true }).callAssistant(api, userTurns, {
            signal: controller.signal,
            chunkCallback: async (chunk) => {
                if (chunk.type !== 'token_data') {
                    return;
                }
                if (controller.signal.aborted) {
                    tokensAfterAbort.push(chunk.content);
                }
                controller.abort();
            },
        });
        // Lets a still-scheduled smoothing tick fire, so an enqueue into the cancelled stream fails the test.
        await new Promise((resolve) => setTimeout(resolve, 50));
        return tokensAfterAbort;
    };

    it('stops emitting the smoothed reply once the server has finished sending', async () => {
        mockedCallChatEndpoint.mockImplementation(async () => stream(longReply + 'data: [DONE]\n\n'));

        expect(await tokensAfterAbortOnFirst()).toEqual([]);
    });

    it('stops emitting the smoothed reply while the server is still sending', async () => {
        mockedCallChatEndpoint.mockImplementation(async () => stillSending(longReply));

        expect(await tokensAfterAbortOnFirst()).toEqual([]);
    });
});
