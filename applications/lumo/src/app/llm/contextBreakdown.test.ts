import { buildContextBreakdown } from './contextBreakdown';
import { getReservedOutputTokens } from './requestBudget';

const tokensOf = (b: ReturnType<typeof buildContextBreakdown>, id: string) =>
    b.segments.find((s) => s.id === id)!.tokens;

describe('buildContextBreakdown', () => {
    it('lays out conversation, files, reserved reply and free space within the window', () => {
        const b = buildContextBreakdown({ conversationTokens: 20_000, fileTokens: 20_000, maxTokens: 128_000 });

        const expectedBuffer = getReservedOutputTokens(128_000, false);
        expect(b.overCapacity).toBe(false);
        expect(b.usedTokens).toBe(40_000);
        // Percentages are against the window minus the reply reservation.
        expect(b.percentageUsed).toBe(Math.round((40_000 / (128_000 - expectedBuffer)) * 100));
        expect(tokensOf(b, 'buffer')).toBe(expectedBuffer);
        expect(tokensOf(b, 'free')).toBe(128_000 - 40_000 - expectedBuffer);

        const sum = b.segments.reduce((acc, s) => acc + s.percentage, 0);
        expect(Math.round(sum)).toBe(100);
    });

    it('is over capacity once usage eats into the reserved reply', () => {
        const b = buildContextBreakdown({
            conversationTokens: 90_000,
            fileTokens: 0,
            maxTokens: 100_000,
            bufferTokens: 20_000,
        });

        expect(b.overCapacity).toBe(true);
        expect(b.percentageUsed).toBe(113);
        expect(tokensOf(b, 'buffer')).toBe(10_000);
    });

    it('scales segments to fill the bar and zeroes buffer/free when over the whole window', () => {
        const b = buildContextBreakdown({ conversationTokens: 120_000, fileTokens: 80_000, maxTokens: 128_000 });

        expect(b.overCapacity).toBe(true);
        expect(tokensOf(b, 'buffer')).toBe(0);
        expect(tokensOf(b, 'free')).toBe(0);

        const conversation = b.segments.find((s) => s.id === 'conversation')!;
        const files = b.segments.find((s) => s.id === 'files')!;
        expect(Math.round(conversation.percentage)).toBe(60);
        expect(Math.round(files.percentage)).toBe(40);
    });

    it('includes tool calls in measured usage and the stacked bar', () => {
        const b = buildContextBreakdown({
            conversationTokens: 10_000,
            toolCallTokens: 5_000,
            fileTokens: 5_000,
            maxTokens: 100_000,
        });

        expect(b.usedTokens).toBe(20_000);
        expect(tokensOf(b, 'tool_calls')).toBe(5_000);
    });

    it('respects an explicit buffer override', () => {
        const b = buildContextBreakdown({
            conversationTokens: 10_000,
            fileTokens: 0,
            maxTokens: 100_000,
            bufferTokens: 5_000,
        });
        expect(tokensOf(b, 'buffer')).toBe(5_000);
        expect(tokensOf(b, 'free')).toBe(85_000);
    });
});
