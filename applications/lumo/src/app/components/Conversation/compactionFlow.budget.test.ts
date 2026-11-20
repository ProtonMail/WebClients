import { ContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { RetrievalContext } from '../../features/client-tools/retrievalTool/retrievalTool';
import { SEARCH_KNOWLEDGE_TOOL_NAME } from '../../features/client-tools/retrievalTool/schema';
import { sendMessageWithRedux } from '../../lib/lumoApiClientRedux';
import { type PreparedRequest, prepareRequest } from '../../llm';
import { compactConversation } from '../../llm/compaction';
import { NotEnoughToCompactError } from '../../llm/compaction/partition';
import { resolveRequestBudget } from '../../llm/requestBudget';
import { SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE, estimateRequestContextUsage } from '../../llm/requestContextUsage';
import { addMessage, deleteMessage, pushMessageRequest } from '../../redux/slices/core/messages';
import type { LumoDispatch } from '../../redux/store';
import { markModelsUnavailable } from '../../services/modelsStore';
import { type Message, Role, type Turn } from '../../types';
import { sendRetrievalReplyEvent } from '../../util/telemetry';
import type { GenerationWithCompactionParams } from './compactionFlow';
import { runGenerationWithCompaction } from './compactionFlow';

/*
 * Regression tests for the compaction retry bugs: a proactive pass using up the overflow
 * retry, and empty assistant placeholders left behind when every attempt overflows.
 */

jest.mock('../../lib/lumoApiClientRedux', () => ({ sendMessageWithRedux: jest.fn() }));
jest.mock('../../util/telemetry', () => ({
    ...jest.requireActual('../../util/telemetry'),
    sendRetrievalReplyEvent: jest.fn(),
}));
jest.mock('../../llm/compaction', () => ({
    ...jest.requireActual('../../llm/compaction'),
    compactConversation: jest.fn(),
}));

beforeAll(() => {
    markModelsUnavailable();
});

const chain: Message[] = [
    { id: 'q1', conversationId: 'conversation', createdAt: '', role: Role.User, blocks: [] },
    { id: 'a1', conversationId: 'conversation', createdAt: '', role: Role.Assistant, blocks: [] },
    { id: 'prompt', conversationId: 'conversation', createdAt: '', role: Role.User, blocks: [] },
];

const compactionBoundaryTurns = (candidate: Message[]): Turn[] =>
    candidate.filter((message) => message.compaction).map(() => ({ role: Role.User, content: 'summary' }));

function run(
    enableProactiveCompaction: boolean,
    {
        buildTurns = compactionBoundaryTurns,
        signal,
        retrievalTools,
        buildRequest,
        messageChain = chain,
        clientToolExecutor,
    }: {
        buildTurns?: (chain: Message[]) => Turn[];
        signal?: AbortSignal;
        retrievalTools?: RetrievalContext;
        buildRequest?: GenerationWithCompactionParams['buildRequest'];
        messageChain?: Message[];
        clientToolExecutor?: NonNullable<GenerationWithCompactionParams['sendOptions']>['clientToolExecutor'];
    } = {}
) {
    const actions: { type: string; payload?: any }[] = [];
    const dispatch = ((action: any) => {
        if (typeof action === 'function') {
            return action(dispatch, () => ({}));
        }
        actions.push(action);
        return action;
    }) as LumoDispatch;
    const result = dispatch(
        runGenerationWithCompaction({
            api: jest.fn() as Api,
            conversationId: 'conversation',
            spaceId: 'space',
            assistantMessageId: 'assistant',
            parentMessageId: 'prompt',
            chain: messageChain,
            buildRequest:
                buildRequest ??
                ((candidate) => {
                    const turns = buildTurns(candidate);
                    return {
                        turns,
                        usage: {
                            conversationTokens: [10_000_000, 100_000][turns.length] ?? 1_000,
                            toolCallTokens: 0,
                            instructionTokens: 0,
                            fileTokens: 0,
                            usedTokens: [10_000_000, 100_000][turns.length] ?? 1_000,
                            hasCompaction: turns.length > 0,
                            activeFiles: [],
                            droppedForBudget: [],
                            excerptedForBudget: new Map(),
                            cardedFiles: new Map(),
                        },
                    } satisfies PreparedRequest;
                }),
            enableProactiveCompaction,
            sendOptions: { signal, retrievalTools, clientToolExecutor },
        })
    );
    return { result, actions };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(compactConversation).mockResolvedValue({
        summary: 'summary',
        summarizedMessageIds: ['q1', 'a1'],
        keptMessageIds: ['prompt'],
        stats: {
            tokensBefore: 50_000,
            tokensAfter: 500,
            tokensRemoved: 49_500,
            summarizedMessageCount: 2,
            keptMessageCount: 1,
            clearedToolResultCount: 0,
            appliedStrategies: ['llm_summary'],
            usedLlmSummary: true,
        },
    });
});

it('still retries on overflow after a proactive compaction', async () => {
    jest.mocked(sendMessageWithRedux)
        .mockImplementationOnce(
            () =>
                (async () => {
                    throw new ContextLengthExceededError();
                }) as unknown as ReturnType<typeof sendMessageWithRedux>
        )
        .mockImplementation(
            () =>
                (async () => ({ status: 'succeeded', turns: [], producedTurns: [] })) as unknown as ReturnType<
                    typeof sendMessageWithRedux
                >
        );

    const { result } = run(true);

    await expect(result).resolves.toMatchObject({ status: 'succeeded' });
});

it('does not leave an empty assistant placeholder behind when the retry also overflows', async () => {
    jest.mocked(sendMessageWithRedux).mockImplementation(
        () =>
            (async () => {
                throw new ContextLengthExceededError();
            }) as unknown as ReturnType<typeof sendMessageWithRedux>
    );

    const { result, actions } = run(false);
    await expect(result).rejects.toBeDefined();

    const deletedIds = actions.filter(deleteMessage.match).map((action) => action.payload);
    const leftoverPlaceholders = actions
        .filter(addMessage.match)
        .map((action) => action.payload)
        .filter((message) => message.role === Role.Assistant && message.placeholder)
        .filter((message) => !deletedIds.includes(message.id));

    expect(leftoverPlaceholders).toEqual([]);
});

const alwaysOverflows = () =>
    jest.mocked(sendMessageWithRedux).mockImplementation(
        () =>
            (async () => {
                throw new ContextLengthExceededError();
            }) as unknown as ReturnType<typeof sendMessageWithRedux>
    );

/** What a reload would show: assistant replies to the prompt that were persisted and not deleted. */
const persistedReplies = (actions: { type: string; payload?: any }[]) => {
    const deletedIds = actions.filter(deleteMessage.match).map((action) => action.payload);
    return actions
        .filter(pushMessageRequest.match)
        .map((action) => action.payload.id)
        .filter((id) => !deletedIds.includes(id));
};

it('keeps a reply when a retry without compaction also overflows', async () => {
    alwaysOverflows();
    jest.mocked(compactConversation).mockRejectedValue(new NotEnoughToCompactError());
    // Recalibration shrinks the plan once (fewer files), so the flow retries without compacting.
    let builds = 0;
    const shrinkingOnce = (): Turn[] => {
        builds += 1;
        return Array.from({ length: builds < 2 ? 0 : 2 }, () => ({ role: Role.User, content: 'turn' }));
    };

    const { result, actions } = run(false, { buildTurns: shrinkingOnce });
    await expect(result).rejects.toBeInstanceOf(ContextLengthExceededError);

    expect(actions.filter(deleteMessage.match).map((action) => action.payload)).toContain('assistant');
    expect(persistedReplies(actions)).toHaveLength(1);
});

it('keeps the overflowed reply when the user stops during reactive compaction', async () => {
    alwaysOverflows();
    const controller = new AbortController();
    jest.mocked(compactConversation).mockImplementation(async () => {
        controller.abort();
        throw new DOMException('The operation was aborted', 'AbortError');
    });

    const { result, actions } = run(false, { signal: controller.signal });
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });

    expect(persistedReplies(actions)).toEqual(['assistant']);
});

it('lets the lookup tools find what a compaction in the same send summarized away', async () => {
    const question: Message = { ...chain[0]!, blocks: [{ type: 'text', content: 'Our launch codename is Bluebird.' }] };
    const messages = Object.fromEntries([question, chain[1]!, chain[2]!].map((message) => [message.id, message]));
    let found: string[] = [];
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                const [result] = await options!.clientToolExecutor!.execute([
                    {
                        id: 'call',
                        name: SEARCH_KNOWLEDGE_TOOL_NAME,
                        arguments: JSON.stringify({ query: 'launch codename', sources: ['messages'] }),
                    },
                ]);
                found = JSON.parse(result!.content).results.map((hit: { message_id: string }) => hit.message_id);
                return { status: 'succeeded', turns: [], producedTurns: [] };
            }) as unknown as ReturnType<typeof sendMessageWithRedux>
    );

    const { result } = run(true, {
        retrievalTools: {
            conversationId: 'conversation',
            spaceId: 'space',
            isProject: false,
            allowWideScopes: false,
            chatSearch: 'none',
            searchOtherSpaces: false,
            allowsSearchFromOutside: () => true,
            exclusions: { attachmentIds: new Set(), documentIds: new Set() },
            hasLumoPlus: true,
            // Computed before the send, when the whole chain still went to the model in full.
            getVisibleMessageIds: () => new Set(Object.keys(messages)),
            chatAttachments: [],
            getState: () => ({ conversations: {}, messages }) as ReturnType<RetrievalContext['getState']>,
        },
    });
    await expect(result).resolves.toMatchObject({ status: 'succeeded' });

    expect(jest.mocked(compactConversation)).toHaveBeenCalled();
    expect(found).toEqual(['q1']);
    expect(jest.mocked(sendRetrievalReplyEvent)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(sendRetrievalReplyEvent)).toHaveBeenCalledWith(
        expect.objectContaining({
            usage: expect.objectContaining({ searches: 1, emptySearches: 0, reads: 0, errors: 0 }),
            chatSearch: 'none',
            isProject: false,
        })
    );
});

it.each([
    { overhead: 'tool definitions', historyChars: 45_000, toolDescriptionChars: 350_000 },
    { overhead: 'the server system prompt', historyChars: 200_000, toolDescriptionChars: 0 },
])(
    'compacts when $overhead puts the displayed request over budget and forwards that same estimate',
    async ({ historyChars, toolDescriptionChars }) => {
        const tools = toolDescriptionChars
            ? [
                  {
                      type: 'function' as const,
                      function: { name: 'lookup', description: 'x'.repeat(toolDescriptionChars), parameters: {} },
                  },
              ]
            : [];
        const messageChain = chain.map((message, index) => ({
            ...message,
            blocks: [{ type: 'text' as const, content: index < 2 ? 'h'.repeat(historyChars) : 'question' }],
        }));
        const budget = resolveRequestBudget({ conversationId: 'conversation' });
        const preview = prepareRequest({ messageChain, clientTools: tools, budget });
        expect(preview.usage.usedTokens).toBeGreaterThan(budget.inputBudget);
        const withoutOverhead = tools.length
            ? prepareRequest({ messageChain, budget }).usage.usedTokens
            : preview.usage.usedTokens - SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE;
        expect(withoutOverhead).toBeLessThan(budget.inputBudget);
        const getClientTools = jest.fn(async () => tools);
        jest.mocked(sendMessageWithRedux).mockImplementation(
            (_api, turns, options) =>
                (async () => {
                    expect(turns.map((turn) => turn.content)).toEqual([expect.stringContaining('summary'), 'question']);
                    expect(options?.estimatedPromptTokens).toBe(estimateRequestContextUsage(turns, tools).usedTokens);
                    expect(options?.estimatedPromptTokens).toBeLessThan(budget.inputBudget);
                    expect(await options?.clientToolExecutor?.getClientTools?.()).toEqual(tools);
                    return { status: 'succeeded', turns: [], producedTurns: [] };
                }) as ReturnType<typeof sendMessageWithRedux>
        );
        const { result } = run(true, {
            messageChain,
            buildRequest: (candidate, clientTools) => prepareRequest({ messageChain: candidate, clientTools, budget }),
            clientToolExecutor: { getClientTools, canExecute: () => false, execute: async () => [] },
        });
        await expect(result).resolves.toEqual({ assistantMessageId: expect.any(String), status: 'succeeded' });
        expect(compactConversation).toHaveBeenCalledTimes(1);
    }
);
