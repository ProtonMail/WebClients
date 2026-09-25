import { type Message, Role } from '../types';
import { estimateEffectiveContextUsage } from './effectiveContextUsage';
import { SUMMARY_TURN_PREFIX } from './compaction/collapse';
import { countTokens } from './tokenizer';
import { DEFAULT_CONTEXT_LIMITS } from './contextLimits';
import type { Attachment } from '../types';

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
    ({ id, filename, tokenCount: tokens, markdown: 'x', processing: false }) as unknown as Attachment;

beforeEach(() => {
    seq = 0;
});

describe('estimateEffectiveContextUsage', () => {
    it('counts the full chain when there is no compaction boundary', () => {
        const chain = [textMsg(Role.User, 'a'.repeat(40)), textMsg(Role.Assistant, 'b'.repeat(40))];
        const usage = estimateEffectiveContextUsage({
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
        const usage = estimateEffectiveContextUsage({
            messageChain: chain,
            contextFilters: [],
            allAttachments: {},
        });

        expect(usage.conversationTokens).toBe(countTokens('question') + countTokens('thinking'));
        expect(usage.toolCallTokens).toBe(countTokens(toolPayload) + countTokens('search results here'));
        expect(usage.usedTokens).toBe(usage.conversationTokens + usage.toolCallTokens);
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

        const usage = estimateEffectiveContextUsage({
            messageChain: chain,
            contextFilters: [],
            allAttachments: {},
        });

        expect(usage.hasCompaction).toBe(true);
        expect(usage.conversationTokens).toBe(
            countTokens(`${SUMMARY_TURN_PREFIX}\n\nLATEST SUMMARY`)
        );
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

        const usage = estimateEffectiveContextUsage({
            messageChain: [old, kept, boundary],
            contextFilters: [],
            allAttachments,
        });

        expect(usage.fileTokens).toBe(100);
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

        const usage = estimateEffectiveContextUsage({
            messageChain: [msg],
            contextFilters: [{ messageId: msg.id, excludedFiles: ['drop.pdf'] }],
            allAttachments,
        });

        expect(usage.fileTokens).toBe(100);
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

        const before = estimateEffectiveContextUsage({
            messageChain: [head, tail],
            contextFilters: [],
            allAttachments,
        });
        const after = estimateEffectiveContextUsage({
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

        const usage = estimateEffectiveContextUsage({
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

        const originalBranchUsage = estimateEffectiveContextUsage({
            messageChain: [old, originalQuestion, boundary],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });
        const editedForkUsage = estimateEffectiveContextUsage({
            messageChain: [old, editedQuestion],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });
        const withoutSharedHistory = estimateEffectiveContextUsage({
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

        const originalFork = estimateEffectiveContextUsage({
            ...common,
            messageChain: [history, originalQuestion, boundary],
        });
        const editedFork = estimateEffectiveContextUsage({
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

        const usage = estimateEffectiveContextUsage({
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

        const usage = estimateEffectiveContextUsage({
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

        const usage = estimateEffectiveContextUsage({
            messageChain: [old, originalQuestion],
            contextFilters: [],
            allAttachments: {},
            messageMap,
        });

        expect(usage.hasCompaction).toBe(false);
        expect(usage.conversationTokens).toBeGreaterThan(countTokens('OTHER FORK SUMMARY'));
    });
});
