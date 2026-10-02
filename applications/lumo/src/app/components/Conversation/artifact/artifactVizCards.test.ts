import { cardsToMarkdown, normalizeDocumentCardFences, parseArtifactCardFence } from './artifactVizCards';

const CARD_ROW = JSON.stringify([
    { type: 'metric', title: 'Accounts', value: '100M+', delta: 'Consumer scale', direction: 'up' },
    { title: 'Revenue | ARR', value: '>$100M' },
]);
const FINDING = JSON.stringify({
    type: 'finding',
    title: 'The tension',
    body: 'Scale without depth.',
    severity: 'warning',
});

describe('parseArtifactCardFence', () => {
    it('parses a card-row of metrics, including entries without an explicit type', () => {
        const cards = parseArtifactCardFence('card-row', CARD_ROW);

        expect(cards?.map((card) => card.title)).toEqual(['Accounts', 'Revenue | ARR']);
        expect(cards?.every((card) => card.type === 'metric')).toBe(true);
    });

    it('parses a single finding card', () => {
        expect(parseArtifactCardFence('card', FINDING)?.[0]).toMatchObject({ type: 'finding', title: 'The tension' });
    });

    it('ignores json fences that merely look like cards', () => {
        expect(parseArtifactCardFence('json', FINDING)).toBeNull();
    });

    it('returns null for an unparseable card fence', () => {
        expect(parseArtifactCardFence('card', '{ not json')).toBeNull();
    });
});

describe('cardsToMarkdown', () => {
    it('writes metrics as a table (escaping pipes) and findings as quotes', () => {
        const cards = [...parseArtifactCardFence('card-row', CARD_ROW)!, ...parseArtifactCardFence('card', FINDING)!];

        expect(cardsToMarkdown(cards)).toBe(
            [
                '| Metric | Value | Change |',
                '| --- | --- | --- |',
                '| Accounts | 100M+ | Consumer scale |',
                '| Revenue \\| ARR | >$100M |  |',
                '',
                '> **The tension**: Scale without depth.',
            ].join('\n')
        );
    });
});

describe('normalizeDocumentCardFences', () => {
    it('replaces card fences and leaves prose, vega and other code fences byte-for-byte', () => {
        const vega = '```vega-lite\n{"mark":"bar"}\n```';
        const code = '```ts\nconst a = 1;\n```';
        const markdown = `## Baseline\n\n\`\`\`card-row\n${CARD_ROW}\n\`\`\`\n\nProse.\n\n${vega}\n\n${code}\n\n\`\`\`card\n${FINDING}\n\`\`\`\n`;

        const result = normalizeDocumentCardFences(markdown);

        expect(result).toContain('## Baseline\n\n| Metric | Value | Change |');
        expect(result).toContain('> **The tension**: Scale without depth.\n');
        expect(result).toContain(`\n\nProse.\n\n${vega}\n\n${code}\n\n`);
        expect(result).not.toContain('```card');
    });

    it('keeps a card fence it cannot parse', () => {
        const markdown = '```card\n{ broken\n```';

        expect(normalizeDocumentCardFences(markdown)).toBe(markdown);
    });
});
