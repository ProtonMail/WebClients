import { buildMarkdownRenderUnits } from '../../LumoMarkdown/card/coalesceMetricCardBlocks';
import { shouldRenderAsCard } from '../../LumoMarkdown/card/detectCardSpec';
import { shouldRenderAsVegaChart } from '../../LumoMarkdown/vega/detectVegaSpec';
import {
    findCompleteMarkdownCodeFence,
    splitMarkdownWithCompleteCodeFences,
} from '../../LumoMarkdown/vega/parseMarkdownCodeFence';
import {
    DOCUMENT_WITH_CHAT_VIZ_BLOCKS,
    PRESENTATION_WITH_CHART_PLACEHOLDER,
    PRESENTATION_WITH_VEGA_LITE_FENCE,
} from './artifactVisualizationFixtures';
import { normalizeDocumentCardFences } from './artifactVizCards';
import { renderChartsInSlideContent, slideContentNeedsChartPass } from './presentationCharts';

jest.mock('vega-embed', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue({
        view: {
            run: jest.fn(),
            resize: jest.fn(),
            toSVG: jest.fn().mockResolvedValue('<svg>fixture-chart</svg>'),
            finalize: jest.fn(),
        },
    }),
}));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

/**
 * Format-boundary regression tests: chat viz fences vs artifact renderers.
 * For live panel preview, use the fixtures in artifactVisualizationFixtures.ts (see file header).
 */
describe('artifact visualization format boundary', () => {
    describe('chat markdown pipeline (ProgressiveMarkdownRenderer inputs)', () => {
        it('treats card-row, card, and vega-lite fences in the document fixture as rich viz blocks', () => {
            const codeSegments = splitMarkdownWithCompleteCodeFences(DOCUMENT_WITH_CHAT_VIZ_BLOCKS).filter(
                (segment): segment is { type: 'code'; language: string; code: string } => {
                    return segment.type === 'code';
                }
            );
            const byLanguage = Object.fromEntries(
                codeSegments.map((segment) => {
                    return [segment.language, segment];
                })
            );

            expect(byLanguage['card-row']?.language).toBe('card-row');
            expect(byLanguage.card?.language).toBe('card');
            expect(byLanguage['vega-lite']?.language).toBe('vega-lite');

            expect(shouldRenderAsCard(byLanguage['card-row'].language, byLanguage['card-row'].code)).toBe(true);
            expect(shouldRenderAsCard(byLanguage.card.language, byLanguage.card.code)).toBe(true);
            expect(shouldRenderAsVegaChart(byLanguage['vega-lite'].language, byLanguage['vega-lite'].code)).toBe(true);

            const units = buildMarkdownRenderUnits([
                { type: 'complete', content: DOCUMENT_WITH_CHAT_VIZ_BLOCKS, key: 'fixture' },
            ]);
            expect(units.some((unit) => unit.kind === 'metric-row')).toBe(true);
        });
    });

    describe('document artifact (D12: cards → plain markdown, charts kept for the panel)', () => {
        it('turns the fixture card-row into a table and the card into a quote, keeping the vega fence', () => {
            const normalized = normalizeDocumentCardFences(DOCUMENT_WITH_CHAT_VIZ_BLOCKS);

            expect(normalized).toContain(
                '| Metric | Value | Change |\n| --- | --- | --- |\n| Accounts | 100M+ | Consumer scale |'
            );
            expect(normalized).toContain('> **The tension**: Scale without enterprise depth.');
            expect(normalized).toContain('```vega-lite\n{');
            expect(normalized).not.toContain('```card');
        });
    });

    describe('presentation slide chart embed format', () => {
        it('flags chat-style vega-lite fences inside section HTML for the chart pass', () => {
            expect(slideContentNeedsChartPass(PRESENTATION_WITH_VEGA_LITE_FENCE)).toBe(true);
            // Not a markdown fence: the backticks sit inside <pre><code>, not at a line start.
            expect(findCompleteMarkdownCodeFence(PRESENTATION_WITH_VEGA_LITE_FENCE)).toBeNull();
        });

        it('pre-renders a vega-lite fence inside slide HTML to SVG (D12 cleanup)', async () => {
            const rendered = await renderChartsInSlideContent(PRESENTATION_WITH_VEGA_LITE_FENCE);
            expect(rendered).toContain('<svg>fixture-chart</svg>');
            expect(rendered).not.toContain('vega-lite/v6.json');
            expect(rendered).not.toContain('```');
            expect(rendered).toContain('What the format boundary is');
        });

        it('pre-renders application/lumo-vega-lite+json script placeholders to SVG', async () => {
            expect(slideContentNeedsChartPass(PRESENTATION_WITH_CHART_PLACEHOLDER)).toBe(true);

            const rendered = await renderChartsInSlideContent(PRESENTATION_WITH_CHART_PLACEHOLDER);
            expect(rendered).toContain('<svg>fixture-chart</svg>');
            expect(rendered).not.toContain('application/lumo-vega-lite+json');
        });
    });
});
