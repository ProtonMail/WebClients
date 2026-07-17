import { buildMarkdownRenderUnits } from './coalesceMetricCardBlocks';
import { parseCardRowFence, parseCardRowSegmentCode } from './parseCardRowFence';

describe('parseCardRowFence', () => {
    const metric = (title: string) => ({ type: 'metric', title, value: '1', direction: 'up' as const });

    it('parses a card-row fence with a JSON array of metrics', () => {
        const fence = `\`\`\`card-row
[
  ${JSON.stringify(metric('Lumo MAU'))},
  ${JSON.stringify(metric('Ecosystem MAU'))}
]
\`\`\``;

        const cards = parseCardRowFence(fence);
        expect(cards).toHaveLength(2);
        expect(JSON.parse(cards![0]!.code).title).toBe('Lumo MAU');
    });

    it('parses card-row metrics when type is omitted but title and value are present', () => {
        const payload = [
            {
                title: '1950 gold:silver ratio',
                value: '38:1',
                delta: 'Historical baseline',
                direction: 'flat',
            },
            {
                title: '1980 silver peak',
                value: '$21/oz',
                delta: '+2,200% from 1970',
                direction: 'up',
            },
            {
                title: '2024 gold:silver ratio',
                value: '81:1',
                delta: 'Near historic high',
                direction: 'flat',
            },
            {
                title: '2026 projected silver',
                value: '$31/oz',
                delta: '+87% from 2024',
                direction: 'up',
            },
        ];

        const fence = `\`\`\`card-row\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
        const cards = parseCardRowFence(fence);

        expect(cards).toHaveLength(4);
        expect(JSON.parse(cards![0]!.code)).toMatchObject({
            type: 'metric',
            title: '1950 gold:silver ratio',
            value: '38:1',
        });
    });

    it('builds a metric-row render unit for card-row fences missing type', () => {
        const fence = `\`\`\`card-row
[
  { "title": "A", "value": "1", "direction": "up" },
  { "title": "B", "value": "2", "direction": "flat" }
]
\`\`\``;

        const units = buildMarkdownRenderUnits([{ type: 'complete', content: fence, key: 'row' }]);
        const metricRows = units.filter((unit) => unit.kind === 'metric-row');

        expect(metricRows).toHaveLength(1);
        expect((metricRows[0] as { cards: unknown[] }).cards).toHaveLength(2);
    });

    it('parses card-row segment code without a markdown fence wrapper', () => {
        const cards = parseCardRowSegmentCode(
            JSON.stringify([{ title: 'Revenue', value: '$1M', direction: 'up' }])
        );

        expect(cards).toHaveLength(1);
        expect(JSON.parse(cards![0]!.code).type).toBe('metric');
    });
});
