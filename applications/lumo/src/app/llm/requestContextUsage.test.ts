import { type Message, Role } from '../types';
import { type PrepareRequestOptions, prepareRequest } from './index';
import { SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE, estimateRequestContextUsage } from './requestContextUsage';

function prepareContextUsage({
    allAttachments,
    ...options
}: Omit<PrepareRequestOptions, 'attachments'> & { allAttachments: Record<string, Attachment> }) {
    return prepareRequest({ ...options, attachments: Object.values(allAttachments) }).usage;
}
import type { Attachment } from '../types';
import { SUMMARY_TURN_PREFIX } from './compaction/collapse';
import { DEFAULT_CONTEXT_LIMITS } from './contextLimits';
import { countTokens } from './tokenizer';

let seq = 0;
function textMsg(role: Role, content: string, overrides: Partial<Message> = {}): Message {
    seq += 1;
    return {
        id: `m${seq}`,
        conversationId: 'conv',
        createdAt: new Date(Date.now() + seq).toISOString(),
        role,
        blocks: [{ type: 'text', content }],
        ...overrides,
    };
}

const fullAttachment = (id: string, filename: string, tokens: number): Attachment =>
    ({
        id,
        filename,
        tokenCount: tokens,
        markdown: 'x'.repeat(tokens * 4),
        processing: false,
    }) as unknown as Attachment;

beforeEach(() => {
    seq = 0;
});

describe('prepareContextUsage', () => {
    it('counts the full chain when there is no compaction boundary', () => {
        const chain = [textMsg(Role.User, 'a'.repeat(40)), textMsg(Role.Assistant, 'b'.repeat(40))];
        const usage = prepareContextUsage({
            messageChain: chain,
            contextFilters: [],
            allAttachments: {},
        });

        expect(usage.conversationTokens).toBeGreaterThan(0);
        expect(usage.toolCallTokens).toBe(0);
        expect(usage.fileTokens).toBe(0);
        expect(usage.hasCompaction).toBe(false);
    });

    it('splits tool_call and tool_result blocks from conversation text', () => {
        const toolPayload = '{"name":"web_search","arguments":{}}';
        const chain = [
            textMsg(Role.User, 'question'),
            textMsg(Role.Assistant, '', {
                blocks: [
                    { type: 'text', content: 'thinking' },
                    { type: 'tool_call', content: toolPayload },
                    { type: 'tool_result', content: 'search results here' },
                ],
            }),
        ];
        const usage = prepareContextUsage({
            messageChain: chain,
            contextFilters: [],
            allAttachments: {},
        });

        expect(usage.conversationTokens).toBe(countTokens('question') + countTokens('thinking'));
        expect(usage.toolCallTokens).toBe(countTokens(toolPayload) + countTokens('search results here'));
        expect(usage.usedTokens).toBe(
            usage.conversationTokens + usage.toolCallTokens + SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE
        );
    });

    it('excludes summarized messages and counts only the latest summary', () => {
        const old = textMsg(Role.User, 'OLD'.repeat(1000));
        const kept = textMsg(Role.User, 'kept');
        const firstBoundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'FIRST SUMMARY',
                summarizedMessageIds: [old.id],
                keptMessageIds: [kept.id],
                stats: {
                    tokensBefore: 100,
                    tokensAfter: 10,
                    tokensRemoved: 90,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const latestBoundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'LATEST SUMMARY',
                summarizedMessageIds: [kept.id],
                keptMessageIds: [],
                stats: {
                    tokensBefore: 50,
                    tokensAfter: 5,
                    tokensRemoved: 45,
                    summarizedMessageCount: 1,
                    keptMessageCount: 0,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const chain = [old, kept, firstBoundary, latestBoundary];

        const usage = prepareContextUsage({
            messageChain: chain,
            contextFilters: [],
            allAttachments: {},
        });

        expect(usage.hasCompaction).toBe(true);
        expect(usage.conversationTokens).toBe(countTokens(`${SUMMARY_TURN_PREFIX}\n\nLATEST SUMMARY`));
        expect(usage.conversationTokens).not.toBe(
            countTokens('FIRST SUMMARY') + countTokens('LATEST SUMMARY') + countTokens('kept')
        );
    });

    it('drops attachments from summarized messages', () => {
        const old = textMsg(Role.User, 'old', {
            attachments: [{ id: 'a1', filename: 'old.pdf' }] as any,
        });
        const kept = textMsg(Role.User, 'kept', {
            attachments: [{ id: 'a2', filename: 'kept.pdf' }] as any,
        });
        const boundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'SUMMARY',
                summarizedMessageIds: [old.id],
                keptMessageIds: [kept.id],
                stats: {
                    tokensBefore: 1000,
                    tokensAfter: 10,
                    tokensRemoved: 990,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const allAttachments = {
            a1: fullAttachment('a1', 'old.pdf', 50_000),
            a2: fullAttachment('a2', 'kept.pdf', 100),
        };

        const usage = prepareContextUsage({
            messageChain: [old, kept, boundary],
            contextFilters: [],
            allAttachments,
        });

        expect(usage.fileTokens).toBe(
            countTokens(
                'Filename: kept.pdf\nFile contents:\n----- BEGIN FILE CONTENTS -----\n' +
                    'x'.repeat(400) +
                    '\n----- END FILE CONTENTS -----'
            )
        );
        expect(usage.activeFiles.map((f) => f.filename)).toEqual(['kept.pdf']);
    });

    it('respects per-message attachment exclusions', () => {
        const msg = textMsg(Role.User, 'files', {
            attachments: [
                { id: 'a1', filename: 'keep.pdf' },
                { id: 'a2', filename: 'drop.pdf' },
            ] as any,
        });
        const allAttachments = {
            a1: fullAttachment('a1', 'keep.pdf', 100),
            a2: fullAttachment('a2', 'drop.pdf', 900),
        };

        const usage = prepareContextUsage({
            messageChain: [msg],
            contextFilters: [{ messageId: msg.id, excludedFiles: ['drop.pdf'] }],
            allAttachments,
        });

        expect(usage.fileTokens).toBe(
            countTokens(
                'Filename: keep.pdf\nFile contents:\n----- BEGIN FILE CONTENTS -----\n' +
                    'x'.repeat(400) +
                    '\n----- END FILE CONTENTS -----'
            )
        );
    });

    it('drops after compaction instead of adding summary on top of summarized content', () => {
        const head = textMsg(Role.User, 'HEAD'.repeat(8000));
        const tail = textMsg(Role.User, 'tail question');
        const boundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'SHORT SUMMARY',
                summarizedMessageIds: [head.id],
                keptMessageIds: [tail.id],
                stats: {
                    tokensBefore: 20_000,
                    tokensAfter: 500,
                    tokensRemoved: 19_500,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const allAttachments = {};

        const before = prepareContextUsage({
            messageChain: [head, tail],
            contextFilters: [],
            allAttachments,
        });
        const after = prepareContextUsage({
            messageChain: [head, tail, boundary],
            contextFilters: [],
            allAttachments,
        });

        expect(after.usedTokens).toBeLessThan(before.usedTokens);
        expect(after.conversationTokens).toBe(
            countTokens(`${SUMMARY_TURN_PREFIX}\n\nSHORT SUMMARY`) + countTokens('tail question')
        );
    });

    it('ignores currentAttachments that belong to summarized messages', () => {
        const old = textMsg(Role.User, 'old', {
            attachments: [{ id: 'a1', filename: 'old.pdf' }] as any,
        });
        const tail = textMsg(Role.User, 'tail');
        const boundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'SUMMARY',
                summarizedMessageIds: [old.id],
                keptMessageIds: [tail.id],
                stats: {
                    tokensBefore: 1000,
                    tokensAfter: 10,
                    tokensRemoved: 990,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const allAttachments = {
            a1: fullAttachment('a1', 'old.pdf', 50_000),
        };

        const usage = prepareContextUsage({
            messageChain: [old, tail, boundary],
            contextFilters: [],
            currentAttachments: [allAttachments.a1],
            allAttachments,
        });

        expect(usage.fileTokens).toBe(0);
    });

    it('applies shared-history compaction from a sibling edit fork', () => {
        const old = textMsg(Role.User, 'OLD'.repeat(8000));
        const originalQuestion = textMsg(Role.User, 'original question');
        const editedQuestion = textMsg(Role.User, 'edited question');
        originalQuestion.parentId = old.id;
        editedQuestion.parentId = old.id;

        const boundary = textMsg(Role.Assistant, '', {
            parentId: originalQuestion.id,
            compaction: {
                summary: 'SHARED SUMMARY',
                summarizedMessageIds: [old.id],
                keptMessageIds: [originalQuestion.id],
                stats: {
                    tokensBefore: 20_000,
                    tokensAfter: 500,
                    tokensRemoved: 19_500,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });

        const messageMap = {
            [old.id]: old,
            [originalQuestion.id]: originalQuestion,
            [editedQuestion.id]: editedQuestion,
            [boundary.id]: boundary,
        };

        const originalBranchUsage = prepareContextUsage({
            messageChain: [old, originalQuestion, boundary],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });
        const editedForkUsage = prepareContextUsage({
            messageChain: [old, editedQuestion],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });
        const withoutSharedHistory = prepareContextUsage({
            messageChain: [old, editedQuestion],
            contextFilters: [],
            allAttachments: {},
        });

        expect(originalBranchUsage.hasCompaction).toBe(true);
        expect(editedForkUsage.hasCompaction).toBe(true);
        expect(editedForkUsage.usedTokens).toBeLessThan(withoutSharedHistory.usedTokens);
        expect(editedForkUsage.conversationTokens).toBe(
            countTokens(`${SUMMARY_TURN_PREFIX}\n\nSHARED SUMMARY`) + countTokens('edited question')
        );
    });

    it('reports the same file cost on both forks of an edited question', () => {
        const history = textMsg(Role.User, 'history', {
            attachments: [{ id: 'a1', filename: 'history.pdf' }] as any,
        });
        const originalQuestion = textMsg(Role.User, 'original question', { parentId: history.id });
        const editedQuestion = textMsg(Role.User, 'edited question', { parentId: history.id });
        const boundary = textMsg(Role.Assistant, '', {
            parentId: originalQuestion.id,
            compaction: {
                summary: 'SHARED SUMMARY',
                summarizedMessageIds: [history.id],
                keptMessageIds: [originalQuestion.id],
                stats: {
                    tokensBefore: 60_000,
                    tokensAfter: 500,
                    tokensRemoved: 59_500,
                    summarizedMessageCount: 1,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });

        const allAttachments = { a1: fullAttachment('a1', 'history.pdf', 60_000) };
        const messageMap = {
            [history.id]: history,
            [originalQuestion.id]: originalQuestion,
            [editedQuestion.id]: editedQuestion,
            [boundary.id]: boundary,
        };
        const common = { contextFilters: [], allAttachments, messageMap };

        const originalFork = prepareContextUsage({
            ...common,
            messageChain: [history, originalQuestion, boundary],
        });
        const editedFork = prepareContextUsage({
            ...common,
            messageChain: [history, editedQuestion],
        });

        // Without the shared boundary the edited fork re-counts history.pdf and lands
        // 60K over the sibling, which is what made one fork read 81% and the other 128%.
        expect(originalFork.hasCompaction).toBe(true);
        expect(editedFork.hasCompaction).toBe(true);
        expect(originalFork.fileTokens).toBe(0);
        expect(editedFork.fileTokens).toBe(0);
        expect(Math.abs(editedFork.usedTokens - originalFork.usedTokens)).toBeLessThan(10);
    });

    it('sheds the weakest files once they no longer fit the request budget', () => {
        const message = textMsg(Role.User, 'question', {
            attachments: [
                { id: 'manual', filename: 'manual.pdf' },
                { id: 'strong', filename: 'strong.pdf' },
                { id: 'weak', filename: 'weak.pdf' },
                { id: 'weaker', filename: 'weaker.pdf' },
            ] as any,
        });

        const autoRetrieved = (id: string, filename: string, relevanceScore: number): Attachment =>
            ({ ...fullAttachment(id, filename, 45_000), autoRetrieved: true, relevanceScore }) as Attachment;

        const allAttachments = {
            manual: fullAttachment('manual', 'manual.pdf', 45_000),
            strong: autoRetrieved('strong', 'strong.pdf', 0.9),
            weak: autoRetrieved('weak', 'weak.pdf', 0.5),
            weaker: autoRetrieved('weaker', 'weaker.pdf', 0.2),
        };

        const usage = prepareContextUsage({
            messageChain: [message],
            contextFilters: [],
            allAttachments,
        });

        expect(usage.usedTokens).toBeLessThan(DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT);
        expect(usage.activeFiles.map((f) => f.filename)).toEqual(['manual.pdf', 'strong.pdf']);
        expect(usage.droppedForBudget.map((f) => f.filename)).toEqual(['weak.pdf', 'weaker.pdf']);
    });

    it('keeps the highest-priority file even when it alone exceeds the budget', () => {
        const message = textMsg(Role.User, 'question', {
            attachments: [{ id: 'huge', filename: 'huge.pdf' }] as any,
        });

        const usage = prepareContextUsage({
            messageChain: [message],
            contextFilters: [],
            allAttachments: { huge: fullAttachment('huge', 'huge.pdf', 500_000) },
        });

        expect(usage.activeFiles.map((f) => f.filename)).toEqual(['huge.pdf']);
        expect(usage.droppedForBudget).toEqual([]);
    });

    it('does not apply a sibling compaction when the fork tip was summarized', () => {
        const old = textMsg(Role.User, 'OLD'.repeat(8000));
        const originalQuestion = textMsg(Role.User, 'original question');
        const editedQuestion = textMsg(Role.User, 'edited question');
        originalQuestion.parentId = old.id;
        editedQuestion.parentId = old.id;

        const boundary = textMsg(Role.Assistant, '', {
            parentId: editedQuestion.id,
            compaction: {
                summary: 'OTHER FORK SUMMARY',
                summarizedMessageIds: [old.id, originalQuestion.id],
                keptMessageIds: [editedQuestion.id],
                stats: {
                    tokensBefore: 20_000,
                    tokensAfter: 500,
                    tokensRemoved: 19_500,
                    summarizedMessageCount: 2,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });

        const messageMap = {
            [old.id]: old,
            [originalQuestion.id]: originalQuestion,
            [editedQuestion.id]: editedQuestion,
            [boundary.id]: boundary,
        };

        const usage = prepareContextUsage({
            messageChain: [old, originalQuestion],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });

        expect(usage.hasCompaction).toBe(false);
        expect(usage.conversationTokens).toBeGreaterThan(countTokens('OTHER FORK SUMMARY'));
    });
});

describe('prepared request accounting', () => {
    const clientTools = [
        {
            type: 'function' as const,
            function: {
                name: 'lookup',
                description: 'Find project information',
                parameters: { type: 'object', properties: {} },
            },
        },
    ];

    it('keeps regenerate instructions immediately before the final user turn and counts them once', () => {
        const retryInstructions = 'Make the answer shorter.';
        const request = prepareRequest({
            messageChain: [
                textMsg(Role.User, 'Earlier question'),
                textMsg(Role.Assistant, 'Earlier answer'),
                textMsg(Role.User, 'Latest question'),
                textMsg(Role.Assistant, ''),
            ],
            retryInstructions,
        });

        expect(request.turns).toEqual([
            { role: Role.User, content: 'Earlier question' },
            { role: Role.Assistant, content: 'Earlier answer' },
            { role: Role.System, content: retryInstructions },
            { role: Role.User, content: 'Latest question' },
        ]);
        expect(request.usage.instructionTokens).toBe(
            SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE + countTokens(retryInstructions)
        );
        expect(request.usage.usedTokens).toBe(estimateRequestContextUsage(request.turns).usedTokens);
    });

    it('counts instructions, tool schemas and tool-result images in the same total as the outgoing turns', () => {
        const toolCall = '{"name":"lookup","arguments":{}}';
        const resultText = 'The project launches in March.';
        const request = prepareRequest({
            messageChain: [
                textMsg(Role.User, 'When?'),
                textMsg(Role.Assistant, '', {
                    blocks: [
                        { type: 'text', content: 'Checking.' },
                        { type: 'tool_call', content: toolCall },
                        {
                            type: 'tool_result',
                            content: resultText,
                            toolImages: [
                                { mime_type: 'image/png', data: 'aW1hZ2U=', image_id: 'figure', path: '/figure.png' },
                            ],
                        },
                    ],
                }),
            ],
            projectInstructions: 'Use the project schedule.',
            clientTools,
        });
        const instructions = '[Project instructions: Use the project schedule.]';
        expect(request.turns.map((turn) => turn.content)).toEqual([
            instructions,
            'When?',
            'Checking.',
            toolCall,
            resultText,
        ]);
        expect(request.usage.instructionTokens).toBe(SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE + countTokens(instructions));
        expect(request.usage.toolCallTokens).toBe(
            countTokens(JSON.stringify(clientTools)) + countTokens(toolCall) + countTokens(resultText) + 2_000
        );
        expect(request.usage.usedTokens).toBe(estimateRequestContextUsage(request.turns, clientTools).usedTokens);
        expect(request.usage.usedTokens).toBe(
            request.usage.conversationTokens +
                request.usage.instructionTokens +
                request.usage.toolCallTokens +
                request.usage.fileTokens
        );
    });

    it('previews provisional files using exactly the same turns and token totals as a send', () => {
        const history = textMsg(Role.User, 'Earlier question');
        const attachment = fullAttachment('file', 'notes.txt', 100);
        const common = { messageChain: [history], clientTools, projectInstructions: 'Answer briefly.' };
        const preview = prepareRequest({ ...common, currentAttachments: [attachment] });
        const send = prepareRequest({
            ...common,
            messageChain: [history, textMsg(Role.User, '', { attachments: [attachment] })],
            attachments: [attachment],
        });
        expect(preview.turns).toEqual(send.turns);
        expect(preview.usage).toEqual(send.usage);
        expect(preview.usage.fileTokens).toBe(
            countTokens(
                'Filename: notes.txt\nFile contents:\n----- BEGIN FILE CONTENTS -----\n' +
                    'x'.repeat(400) +
                    '\n----- END FILE CONTENTS -----'
            )
        );
    });
});
