import { buildMarkdownRenderUnits } from './coalesceMetricCardBlocks';

describe('coalesceMetricCardBlocks', () => {
    const metric = (title: string) => ({ type: 'metric', title, value: '1', direction: 'up' as const });

    it('promotes a standalone card-row fence into one metric row', () => {
        const cardRow = `\`\`\`card-row
[
  ${JSON.stringify(metric('Lumo MAU'))},
  ${JSON.stringify(metric('Ecosystem MAU'))}
]
\`\`\``;

        const units = buildMarkdownRenderUnits([{ type: 'complete', content: cardRow, key: 'row' }]);

        expect(units).toHaveLength(1);
        expect(units[0]).toMatchObject({ kind: 'metric-row' });
        expect((units[0] as { cards: unknown[] }).cards).toHaveLength(2);
    });

    it('promotes card-row fences embedded in mixed markdown', () => {
        const cardRow = `\`\`\`card-row
[
  ${JSON.stringify(metric('Lumo MAU'))},
  ${JSON.stringify(metric('Ecosystem MAU'))},
  ${JSON.stringify(metric('Engagement'))},
  ${JSON.stringify(metric('Error rate'))}
]
\`\`\``;

        const units = buildMarkdownRenderUnits([
            {
                type: 'complete',
                content: `# Summary\n\n## Key Performance Indicators\n\n${cardRow}`,
                key: 'final',
            },
        ]);

        const metricRow = units.find((unit) => unit.kind === 'metric-row');
        expect(metricRow).toBeDefined();
        expect((metricRow as { cards: unknown[] }).cards).toHaveLength(4);
    });

    it('leaves legacy separate metric card fences as regular blocks', () => {
        const metricFence = (title: string) =>
            `\`\`\`card\n${JSON.stringify(metric(title))}\n\`\`\``;

        const units = buildMarkdownRenderUnits([
            { type: 'complete', content: metricFence('DAU'), key: 'a' },
            { type: 'complete', content: metricFence('Latency'), key: 'b' },
        ]);

        expect(units.every((unit) => unit.kind === 'block')).toBe(true);
    });

    it('passes incomplete blocks through for streaming renderers', () => {
        const units = buildMarkdownRenderUnits([
            {
                type: 'incomplete',
                content: '```card-row\n[{"title":"A","value":"1"',
                key: 'streaming',
            },
        ]);

        expect(units).toHaveLength(1);
        expect(units[0]).toMatchObject({ kind: 'block' });
    });
});
