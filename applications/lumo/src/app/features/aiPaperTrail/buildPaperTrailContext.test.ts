import { buildPaperTrailContext } from './buildPaperTrailContext';
import type { NormalizedExport } from './parsers';

const exportData: NormalizedExport = {
    source: 'chatgpt',
    conversations: [
        { title: 'Money', userPrompts: ['How do I budget?', '   '] },
        { title: 'Empty', userPrompts: [] },
    ],
};

describe('buildPaperTrailContext', () => {
    it('keeps user prompts, skips empties, and reports stats', () => {
        const { text, stats } = buildPaperTrailContext(exportData);
        expect(text).toContain('## Money');
        expect(text).toContain('- How do I budget?');
        expect(text).not.toContain('## Empty');
        expect(stats.includedPromptCount).toBe(1);
        expect(stats.conversationCount).toBe(2);
    });

    it('trims long prompts and flags truncation', () => {
        const long = 'a'.repeat(50);
        const { text, stats } = buildPaperTrailContext(
            { source: 'claude', conversations: [{ title: 'T', userPrompts: [long] }] },
            { maxCharsPerPrompt: 10, maxPrompts: 400, maxTotalChars: 120000 }
        );
        expect(text).toContain('…');
        expect(text).not.toContain(long);
        expect(stats.truncated).toBe(false);
    });

    it('caps the number of prompts', () => {
        const prompts = Array.from({ length: 5 }, (_, i) => `prompt ${i}`);
        const { stats } = buildPaperTrailContext(
            { source: 'chatgpt', conversations: [{ title: 'T', userPrompts: prompts }] },
            { maxCharsPerPrompt: 600, maxPrompts: 2, maxTotalChars: 120000 }
        );
        expect(stats.includedPromptCount).toBe(2);
        expect(stats.truncated).toBe(true);
    });
});
