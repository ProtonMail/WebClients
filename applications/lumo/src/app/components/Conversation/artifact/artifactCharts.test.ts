import { CHART_TABLE_MAX_ROWS, chartSpecToMarkdown } from './artifactCharts';

// The Proton Pass report spec from manual QA, trimmed to three rows.
const PRICING_SPEC = JSON.stringify({
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: { text: 'Password Manager Pricing', subtitle: 'Pass offers more in its free tier' },
    data: {
        values: [
            { manager: 'Proton Pass Plus', price: 35.88, plan_type: 'Paid' },
            { manager: 'Bitwarden | Premium', price: 19.8, plan_type: 'Paid' },
            { manager: 'LastPass Free', price: 0 },
        ],
    },
    mark: { type: 'bar' },
    encoding: {
        x: { field: 'manager', type: 'ordinal', title: 'Password Manager' },
        y: { field: 'price', type: 'quantitative', title: 'Annual Price (USD)' },
        color: { field: 'plan_type', type: 'nominal' },
    },
});

describe('chartSpecToMarkdown (D12 Word fallback when a chart cannot be rendered)', () => {
    it('writes the title, subtitle and inline data as a table headed by the axis titles', () => {
        expect(chartSpecToMarkdown(PRICING_SPEC)).toBe(
            [
                '**Chart: Password Manager Pricing**',
                '',
                '*Pass offers more in its free tier*',
                '',
                '| Password Manager | Annual Price (USD) | plan_type |',
                '| --- | --- | --- |',
                '| Proton Pass Plus | 35.88 | Paid |',
                '| Bitwarden \\| Premium | 19.8 | Paid |',
                '| LastPass Free | 0 |  |',
            ].join('\n')
        );
    });

    it('caps long series and says how many rows were left out', () => {
        const values = Array.from({ length: CHART_TABLE_MAX_ROWS + 7 }, (_, index) => {
            return { x: index };
        });
        const markdown = chartSpecToMarkdown(JSON.stringify({ mark: 'line', data: { values } }));

        expect(markdown.split('\n').filter((line) => line.startsWith('| ') && !line.includes('---'))).toHaveLength(
            CHART_TABLE_MAX_ROWS + 1
        );
        expect(markdown).toContain('*…and 7 more rows.*');
    });

    it('keeps only the title lines when the data is not a flat inline table, or the spec does not parse', () => {
        expect(chartSpecToMarkdown('{"title":"Trend","layer":[{"data":{"values":[{"a":1}]}}]}')).toBe(
            '**Chart: Trend**'
        );
        expect(chartSpecToMarkdown('{ not json')).toBe('**Chart**');
    });
});
