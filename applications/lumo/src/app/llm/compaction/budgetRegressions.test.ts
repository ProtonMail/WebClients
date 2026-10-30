import { ContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';

import { analyzeError } from '../../services/errors/errorAnalyzer';
import { type Attachment, LUMO_API_ERRORS, type Message, Role } from '../../types';
import { DEFAULT_CONTEXT_LIMITS } from '../contextLimits';
import { REQUEST_OVERHEAD_TOKEN_ALLOWANCE, getFileTokenBudget, getRequestBudget } from '../requestBudget';
import { resolveRequestContextFiles } from '../requestContextFiles';
import { calculateAttachmentContextSize } from '../utils';
import { compactConversation } from './engine';
import { NotEnoughToCompactError } from './partition';

/*
 * Regression tests for the compaction budget bugs: an oversized file budget, a single
 * document larger than the budget, double-counted head files and the untyped over-context error.
 */

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

const fullAttachment = (id: string, filename: string, tokens: number, extra: Partial<Attachment> = {}): Attachment =>
    ({ id, filename, tokenCount: tokens, markdown: 'x', processing: false, ...extra }) as unknown as Attachment;

beforeEach(() => {
    seq = 0;
});

describe('file budget', () => {
    it.each([false, true])('never plans a request larger than the input budget (reasoning: %s)', (reasoning) => {
        const budget = getRequestBudget({ limits: DEFAULT_CONTEXT_LIMITS, reasoning });
        // History that still fits on its own, but leaves little room for files.
        const historyTokens = budget.inputBudget - REQUEST_OVERHEAD_TOKEN_ALLOWANCE - 2_000;

        const fileBudget = getFileTokenBudget(budget, historyTokens);

        expect(historyTokens + REQUEST_OVERHEAD_TOKEN_ALLOWANCE + fileBudget).toBeLessThanOrEqual(budget.inputBudget);
    });

    it('does not send a single document larger than the file budget in full', () => {
        const question = textMsg(Role.User, 'summarise this', {
            attachments: [{ id: 'big', filename: 'big.pdf' }] as any,
        });
        const big = fullAttachment('big', 'big.pdf', 50_000);

        const { files } = resolveRequestContextFiles([question], [], { big }, [], 10_000);

        expect(calculateAttachmentContextSize(files)).toBeLessThanOrEqual(10_000);
    });

    describe('with file cards', () => {
        const cards = { maxInlineTokens: 8_000, cardTokens: () => 300 };
        const question = textMsg(Role.User, 'compare these', {
            attachments: [
                { id: 'small', filename: 'small.md' },
                { id: 'large', filename: 'large.md' },
                { id: 'medium', filename: 'medium.md' },
            ] as any,
        });
        const attachments = {
            small: fullAttachment('small', 'small.md', 3_000),
            large: fullAttachment('large', 'large.md', 30_000),
            medium: fullAttachment('medium', 'medium.md', 6_000),
        };

        it('sends files over the inline limit as cards even when the budget has room', () => {
            const { files, cardedFiles, excerptedForBudget } = resolveRequestContextFiles(
                [question],
                [],
                attachments,
                [],
                100_000,
                cards
            );

            expect([...cardedFiles]).toEqual([['large', 'size']]);
            expect(excerptedForBudget.size).toBe(0);
            expect(calculateAttachmentContextSize(files)).toBe(3_000 + 300 + 6_000);
        });

        it('sends a file that no longer fits as a card instead of an excerpt', () => {
            const { cardedFiles, excerptedForBudget, droppedForBudget } = resolveRequestContextFiles(
                [question],
                [],
                attachments,
                [],
                5_000,
                cards
            );

            expect(cardedFiles).toEqual(
                new Map([
                    ['large', 'size'],
                    ['medium', 'budget'],
                ])
            );
            expect(excerptedForBudget.size).toBe(0);
            expect(droppedForBudget).toEqual([]);
        });
    });
});

describe('compaction stats', () => {
    it('does not count a head file as reclaimed when the tail still sends the same document', async () => {
        const headQuestion = textMsg(Role.User, 'first look at the report', {
            attachments: [{ id: 'a1', filename: 'report.pdf' }] as any,
        });
        const answer = textMsg(Role.Assistant, 'ok');
        const tailQuestion = textMsg(Role.User, 'and now this part of the report', {
            attachments: [{ id: 'a2', filename: 'report.pdf' }] as any,
        });
        const attachments = [fullAttachment('a1', 'report.pdf', 30_000), fullAttachment('a2', 'report.pdf', 30_000)];

        // The document is deduplicated per request, so dropping the head copy frees nothing:
        // this must be refused rather than reported as ~30K tokens freed.
        await expect(
            compactConversation([headQuestion, answer, tailQuestion], undefined, {
                attachments,
                keepMinRecentMessages: 2,
            })
        ).rejects.toBeInstanceOf(NotEnoughToCompactError);
    });
});

describe('over-context error', () => {
    it('is classified as a context-window error rather than an unknown error', () => {
        const analyzed = analyzeError(new ContextLengthExceededError());

        expect(analyzed.lumoErrorType).toBe(LUMO_API_ERRORS.CONTEXT_WINDOW_EXCEEDED);
    });
});
