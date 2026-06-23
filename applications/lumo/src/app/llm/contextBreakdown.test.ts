import { buildContextBreakdown } from './contextBreakdown';

const tokensOf = (b: ReturnType<typeof buildContextBreakdown>, id: string) =>
    b.segments.find((s) => s.id === id)!.tokens;

describe('buildContextBreakdown', () => {
    it('lays out conversation, files, reserved buffer and free space within the window', () => {
        const b = buildContextBreakdown({ conversationTokens: 20_000, fileTokens: 20_000, maxTokens: 128_000 });

        expect(b.overCapacity).toBe(false);
        expect(b.usedTokens).toBe(40_000);
        expect(b.percentageUsed).toBe(31);
        // Default reserved buffer is max - proactive threshold (~10% of the window).
        expect(tokensOf(b, 'buffer')).toBe(12_800);
        expect(tokensOf(b, 'free')).toBe(128_000 - 40_000 - 12_800);

        const sum = b.segments.reduce((acc, s) => acc + s.percentage, 0);
        expect(Math.round(sum)).toBe(100);
    });

    it('scales segments to fill the bar and zeroes buffer/free when over capacity', () => {
        const b = buildContextBreakdown({ conversationTokens: 120_000, fileTokens: 80_000, maxTokens: 128_000 });

        expect(b.overCapacity).toBe(true);
        expect(b.percentageUsed).toBe(156);
        expect(tokensOf(b, 'buffer')).toBe(0);
        expect(tokensOf(b, 'free')).toBe(0);

        const conversation = b.segments.find((s) => s.id === 'conversation')!;
        const files = b.segments.find((s) => s.id === 'files')!;
        expect(Math.round(conversation.percentage)).toBe(60);
        expect(Math.round(files.percentage)).toBe(40);
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
