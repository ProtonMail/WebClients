import { type Message, Role } from '../../types';
import { collapseCompactedChain } from './collapse';
import { compactConversation } from './engine';
import { NotEnoughToCompactError, partitionChain } from './partition';
import { clearOldToolResults, dropToolPairs, stripContext } from './strategies';
import { collectClearedToolNames, collectDroppedToolNames, collectRemovedFiles } from './audit';
import { CLEARED_TOOL_RESULT_PLACEHOLDER, IMAGE_TOKEN_ESTIMATE } from './constants';
import { estimateChainAttachmentTokens, estimateTurnsTokens } from './tokens';
import type { Attachment } from '../../types';

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

function toolMsg(content: string): Message {
    seq += 1;
    return {
        id: `t${seq}`,
        conversationId: 'conv',
        createdAt: new Date(Date.now() + seq).toISOString(),
        role: Role.Assistant,
        blocks: [
            { type: 'tool_call', content: '{"name":"web_search"}' },
            { type: 'tool_result', content },
        ],
    };
}

beforeEach(() => {
    seq = 0;
});

describe('partitionChain', () => {
    it('throws when there is nothing to compact', () => {
        expect(() => partitionChain([textMsg(Role.User, 'hi')])).toThrow(NotEnoughToCompactError);
    });

    it('keeps both head and tail non-empty', () => {
        const chain = [
            textMsg(Role.User, 'a'),
            textMsg(Role.Assistant, 'b'),
            textMsg(Role.User, 'c'),
            textMsg(Role.Assistant, 'd'),
        ];
        const { head, tail } = partitionChain(chain, { keepRecentTokenBudget: 1, keepMinRecentMessages: 1 });
        expect(head.length).toBeGreaterThanOrEqual(1);
        expect(tail.length).toBeGreaterThanOrEqual(1);
        expect(head.length + tail.length).toBe(chain.length);
        // The most recent message is always preserved.
        expect(tail[tail.length - 1].id).toBe(chain[chain.length - 1].id);
    });
});

describe('strategies', () => {
    it('clearOldToolResults clears all but the most recent N results', () => {
        const messages = [toolMsg('result-1'), toolMsg('result-2'), toolMsg('result-3')];
        const { messages: out, affected } = clearOldToolResults(messages, 1);
        expect(affected).toBe(2);
        const results = out.flatMap((m) => m.blocks ?? []).filter((b) => b.type === 'tool_result');
        expect(results[0].content).toBe(CLEARED_TOOL_RESULT_PLACEHOLDER);
        expect(results[1].content).toBe(CLEARED_TOOL_RESULT_PLACEHOLDER);
        expect(results[2].content).toBe('result-3');
    });

    it('dropToolPairs removes all tool blocks', () => {
        const messages = [toolMsg('r1'), textMsg(Role.Assistant, 'prose')];
        const { messages: out, affected } = dropToolPairs(messages);
        expect(affected).toBe(2); // one tool_call + one tool_result
        const toolBlocks = out.flatMap((m) => m.blocks ?? []).filter((b) => b.type !== 'text');
        expect(toolBlocks).toHaveLength(0);
    });

    it('stripContext removes the context field', () => {
        const messages = [textMsg(Role.User, 'q', { context: 'big file content' })];
        const { messages: out, affected } = stripContext(messages);
        expect(affected).toBe(1);
        expect(out[0].context).toBeUndefined();
    });
});

describe('compactConversation', () => {
    it('returns a condensed transcript without the LLM when already small', async () => {
        const chain = [
            textMsg(Role.User, 'hello'),
            textMsg(Role.Assistant, 'hi'),
            textMsg(Role.User, 'how are you'),
        ];
        const summarize = jest.fn();
        const result = await compactConversation(chain, undefined, { targetTokens: 1e9, summarize });
        expect(summarize).not.toHaveBeenCalled();
        expect(result.stats.usedLlmSummary).toBe(false);
        expect(result.stats.appliedStrategies).toHaveLength(0);
        expect(result.summarizedMessageIds.length + result.keptMessageIds.length).toBe(chain.length);
    });

    it('falls back to the LLM summary when reduction is insufficient', async () => {
        const big = 'x'.repeat(8000);
        const chain = [
            textMsg(Role.User, big),
            textMsg(Role.Assistant, big),
            textMsg(Role.User, big),
            textMsg(Role.Assistant, big),
            textMsg(Role.User, 'latest question'),
        ];
        const summarize = jest.fn().mockResolvedValue('CONDENSED SUMMARY');
        const result = await compactConversation(chain, undefined, {
            targetTokens: 10,
            keepRecentTokenBudget: 10,
            keepMinRecentMessages: 1,
            summarize,
        });
        expect(summarize).toHaveBeenCalledTimes(1);
        expect(result.summary).toBe('CONDENSED SUMMARY');
        expect(result.stats.usedLlmSummary).toBe(true);
        expect(result.stats.appliedStrategies).toContain('llm_summary');
        expect(result.stats.tokensRemoved).toBeGreaterThan(0);
        // The latest question is preserved verbatim.
        expect(result.keptMessageIds).toContain(chain[chain.length - 1].id);
    });

    it('clears tool results before resorting to the LLM', async () => {
        const big = 'y'.repeat(8000);
        const chain = [
            toolMsg(big),
            toolMsg(big),
            toolMsg(big),
            toolMsg(big),
            toolMsg(big),
            textMsg(Role.User, 'latest'),
        ];
        const summarize = jest.fn().mockResolvedValue('SUMMARY');
        const result = await compactConversation(chain, undefined, {
            targetTokens: 5000,
            keepRecentTokenBudget: 10,
            keepMinRecentMessages: 1,
            summarize,
        });
        expect(result.stats.appliedStrategies[0]).toBe('clear_tool_results');
        expect(result.stats.clearedToolResultCount).toBeGreaterThan(0);
        expect(result.stats.audit?.clearedTools).toContain('web_search');
    });

    it('records removed files in audit metadata', async () => {
        const chain = [
            textMsg(Role.User, 'review this', {
                attachments: [{ id: 'a1', filename: 'contract.pdf' }],
                contextFiles: ['a2'],
            } as Partial<Message>),
            textMsg(Role.Assistant, 'done'),
            textMsg(Role.User, 'latest'),
        ];
        const attachments = [
            { id: 'a1', filename: 'contract.pdf' },
            { id: 'a2', filename: 'evidence.xlsx' },
        ] as Attachment[];

        const result = await compactConversation(chain, undefined, {
            targetTokens: 1e9,
            attachments,
            keepRecentTokenBudget: 1,
            keepMinRecentMessages: 1,
        });

        expect(result.stats.audit?.removedFiles).toEqual(['contract.pdf', 'evidence.xlsx']);
    });
});

describe('compaction audit helpers', () => {
    it('collects cleared and dropped tool names separately', () => {
        const before = [toolMsg('result-1'), toolMsg('result-2'), textMsg(Role.Assistant, 'prose')];
        const afterClear = clearOldToolResults(before, 1).messages;
        expect(collectClearedToolNames(before, afterClear)).toEqual(['web_search']);

        const afterDrop = dropToolPairs(before).messages;
        expect(collectDroppedToolNames(before, afterDrop)).toEqual(['web_search']);
    });

    it('collects filenames from attachments and context files', () => {
        const messages = [
            textMsg(Role.User, 'x', {
                attachments: [{ id: 'a1', filename: 'a.pdf' }],
                contextFiles: ['a2'],
            } as Partial<Message>),
        ];
        const attachments = [{ id: 'a2', filename: 'b.xlsx' }] as Attachment[];
        expect(collectRemovedFiles(messages, attachments)).toEqual(['a.pdf', 'b.xlsx']);
    });
});

describe('estimateTurnsTokens', () => {
    it('counts text content and adds a flat estimate per image', () => {
        const turns = [
            { role: Role.User, content: 'a'.repeat(40) }, // ~10 tokens
            { role: Role.User, content: 'image turn', images: [{ encrypted: false, image_id: 'i', data: 'x' }] },
        ];
        const tokens = estimateTurnsTokens(turns as any);
        // 10 (text) + ~3 (image turn text) + IMAGE_TOKEN_ESTIMATE for the one image
        expect(tokens).toBeGreaterThanOrEqual(IMAGE_TOKEN_ESTIMATE);
        expect(tokens).toBeGreaterThan(IMAGE_TOKEN_ESTIMATE + 10);
    });
});

describe('estimateChainAttachmentTokens', () => {
    const fullAttachment = (id: string, filename: string, tokens: number): Attachment =>
        ({ id, filename, tokenCount: tokens, markdown: 'x', processing: false }) as unknown as Attachment;

    it('counts active attachments and ignores excluded files', () => {
        const msg = textMsg(Role.User, 'see files', {
            id: 'mA',
            attachments: [
                { id: 'a1', filename: 'keep.md' },
                { id: 'a2', filename: 'drop.md' },
            ] as any,
        });
        const all = [fullAttachment('a1', 'keep.md', 100), fullAttachment('a2', 'drop.md', 900)];

        const noFilter = estimateChainAttachmentTokens([msg], all, []);
        const withFilter = estimateChainAttachmentTokens([msg], all, [
            { messageId: 'mA', excludedFiles: ['drop.md'] },
        ]);

        expect(noFilter).toBe(1000);
        expect(withFilter).toBe(100);
    });
});

describe('collapseCompactedChain', () => {
    it('returns the chain untouched when there is no boundary', () => {
        const chain = [textMsg(Role.User, 'a'), textMsg(Role.Assistant, 'b')];
        const { summaryTurn, chain: out } = collapseCompactedChain(chain);
        expect(summaryTurn).toBeNull();
        expect(out).toBe(chain);
    });

    it('drops summarized messages and markers and injects a summary turn', () => {
        const u1 = textMsg(Role.User, 'old question');
        const a1 = textMsg(Role.Assistant, 'old answer');
        const u2 = textMsg(Role.User, 'recent question');
        const boundary = textMsg(Role.Assistant, '', {
            compaction: {
                summary: 'SUMMARY OF OLD STUFF',
                summarizedMessageIds: [u1.id, a1.id],
                keptMessageIds: [u2.id],
                stats: {
                    tokensBefore: 100,
                    tokensAfter: 10,
                    tokensRemoved: 90,
                    summarizedMessageCount: 2,
                    keptMessageCount: 1,
                    clearedToolResultCount: 0,
                    appliedStrategies: ['llm_summary'],
                    usedLlmSummary: true,
                },
                createdAt: new Date().toISOString(),
            },
        });
        const u3 = textMsg(Role.User, 'newest question');

        const { summaryTurn, chain: out } = collapseCompactedChain([u1, a1, u2, boundary, u3]);
        expect(summaryTurn).not.toBeNull();
        expect(summaryTurn!.role).toBe(Role.System);
        expect(summaryTurn!.content).toContain('SUMMARY OF OLD STUFF');
        expect(out.map((m) => m.id)).toEqual([u2.id, u3.id]);
    });
});
