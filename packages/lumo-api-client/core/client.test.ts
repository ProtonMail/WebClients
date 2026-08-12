import type { Api } from '@proton/shared/lib/interfaces';

import type { ChatCompletionsRequest } from '../types-api';
import { CLIENT_TOOL_ROUND_BUDGET, LumoApiClient, MAX_CLIENT_TOOL_ROUNDS } from './client';
import type { ClientToolExecutor, ClientToolResult, PendingClientToolCall } from './client-tools';
import { callChatEndpoint } from './network';
import { type GenerationResponseMessage, Role } from './types';

jest.mock('uuid', () => ({ v4: () => 'request-id' }));
jest.mock('./encryption', () => ({ DEFAULT_LUMO_PUB_KEY: 'pub-key', encryptTurns: async (turns: unknown) => turns }));
jest.mock('./encryptionParams', () => ({ RequestEncryptionParams: { create: async () => null } }));
jest.mock('./transforms/decrypt', () => ({
    decryptToolCallArguments: async (calls: unknown) => calls,
    makeDecryptionTransformStream: () => new TransformStream(),
}));

jest.mock('./network', () => ({
    LUMO_CHAT_ENDPOINT: 'ai/v1/chat/completions',
    callChatEndpoint: jest.fn(),
}));

const mockedCallChatEndpoint = callChatEndpoint as jest.MockedFunction<typeof callChatEndpoint>;

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

/** Executor whose every call succeeds; `billableFor` decides which of them spend the budget. */
const makeExecutor = (billableFor: (call: PendingClientToolCall) => boolean): ClientToolExecutor => ({
    canExecute: () => true,
    execute: async (calls): Promise<ClientToolResult[]> =>
        calls.map((call) => ({ content: `ran ${call.name}`, billable: billableFor(call) })),
});

const sentRequests = (): ChatCompletionsRequest[] =>
    mockedCallChatEndpoint.mock.calls.map(([, payload]) => payload as ChatCompletionsRequest);

const api = (() => {}) as unknown as Api;
const userTurns = [{ role: 'user' as any, content: 'find my festival tickets' }];
const searchTool = { type: 'function' as const, function: { name: 'search', description: '', parameters: {} } };

const alwaysCallsTools = () => mockedCallChatEndpoint.mockImplementation(async () => toolCallResponse('search'));

const newClient = () => new LumoApiClient({ enableU2LEncryption: false, enableSmoothing: false });

beforeEach(() => {
    mockedCallChatEndpoint.mockReset();
});

describe('callAssistant client tool rounds', () => {
    it('stops on the budget and reports it, rather than running a round the caller cannot see', async () => {
        alwaysCallsTools();

        const result = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => true),
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(CLIENT_TOOL_ROUND_BUDGET);
        expect(result.stoppedOnBudget).toBe(true);
    });

    it('returns the chain it got through, so the caller can resume it without re-asking the model', async () => {
        alwaysCallsTools();

        const { turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => true),
            clientTools: [searchTool],
        });

        expect(turns.filter((turn) => turn.content === 'ran search')).toHaveLength(CLIENT_TOOL_ROUND_BUDGET);
        expect(turns[0]).toEqual(userTurns[0]);
    });

    it('does not report a budget stop when the model stops calling tools', async () => {
        mockedCallChatEndpoint.mockImplementation(async () => proseResponse('Here it is.'));

        const result = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => true),
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(1);
        expect(result.stoppedOnBudget).toBe(false);
    });

    it('does not report a budget stop when there is no executor to run the calls', async () => {
        alwaysCallsTools();

        const result = await newClient().callAssistant(api, userTurns, { clientTools: [searchTool] });

        expect(sentRequests()).toHaveLength(1);
        expect(result.stoppedOnBudget).toBe(false);
    });

    it('does not spend the budget on a non-billable round, so a guided chain gets the same work done', async () => {
        let generations = 0;
        mockedCallChatEndpoint.mockImplementation(async () => {
            generations += 1;
            return toolCallResponse(generations === 1 ? 'load_guide' : 'search');
        });

        await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor((call) => call.name !== 'load_guide'),
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(CLIENT_TOOL_ROUND_BUDGET + 1);
    });

    it('terminates when every round is non-billable', async () => {
        alwaysCallsTools();

        const result = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => false),
            clientTools: [searchTool],
        });

        expect(sentRequests()).toHaveLength(MAX_CLIENT_TOOL_ROUNDS);
        expect(result.stoppedOnBudget).toBe(true);
    });

    it('closes the turn off cleanly on a budget stop, so the caller can offer to carry on', async () => {
        alwaysCallsTools();
        const chunks: GenerationResponseMessage[] = [];
        const finishCallback = jest.fn();

        const result = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => true),
            clientTools: [searchTool],
            chunkCallback: async (chunk) => {
                chunks.push(chunk);
            },
            finishCallback,
        });

        expect(result.stoppedOnBudget).toBe(true);
        expect(chunks.filter((chunk) => chunk.type === 'done')).toHaveLength(1);
        expect(finishCallback).toHaveBeenCalledTimes(1);
        expect(finishCallback).toHaveBeenCalledWith('succeeded');
    });

    it('carries what the model said into the chain, so a resume does not make it repeat itself', async () => {
        mockedCallChatEndpoint.mockImplementation(async () => toolCallResponse('search', 'Looking now.'));

        const { turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: makeExecutor(() => true),
            clientTools: [searchTool],
        });

        expect(turns.filter((turn) => turn.content === 'Looking now.')).toHaveLength(CLIENT_TOOL_ROUND_BUDGET);
        expect(turns[turns.length - 1]).toEqual({ role: Role.Assistant, content: '' });
    });

    it('reports a missing tool result to the model instead of failing the whole turn', async () => {
        mockedCallChatEndpoint
            .mockImplementationOnce(async () => toolCallResponse('search'))
            .mockImplementation(async () => proseResponse('Here it is.'));

        const { status, turns } = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: { canExecute: () => true, execute: async () => [] },
            clientTools: [searchTool],
        });

        expect(status).toBe('succeeded');
        expect(turns.some((turn) => turn.content?.includes('The search tool returned no result'))).toBe(true);
    });

    it('does not report a budget stop when the user stopped the chain mid-tool', async () => {
        alwaysCallsTools();
        const controller = new AbortController();
        let executions = 0;

        const result = await newClient().callAssistant(api, userTurns, {
            clientToolExecutor: {
                canExecute: () => true,
                execute: async (calls) => {
                    executions += 1;
                    if (executions === CLIENT_TOOL_ROUND_BUDGET) {
                        controller.abort();
                    }
                    return calls.map((call) => ({ content: `ran ${call.name}` }));
                },
            },
            clientTools: [searchTool],
            signal: controller.signal,
        });

        expect(executions).toBe(CLIENT_TOOL_ROUND_BUDGET);
        expect(result.stoppedOnBudget).toBe(false);
    });
});
