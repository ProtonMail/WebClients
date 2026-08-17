import { renderChartsInSlideContent, slideContentHasChartPlaceholder } from './presentationCharts';

// `vega-embed` ships ESM-only and isn't wired into this repo's Jest transform allowlist (unlike
// `vega` itself, which already resolves cleanly for secureVegaLoader.test.ts) — mocking it here
// keeps this suite focused on our own placeholder-detection/splicing/fallback logic rather than
// on vega-embed's internals, and sidesteps that unrelated Jest config gap entirely.
const mockEmbed = jest.fn();
jest.mock('vega-embed', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockEmbed(...args),
}));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

function chartPlaceholder(specJson: string): string {
    return `<script type="application/lumo-vega-lite+json">${specJson}</script>`;
}

function mockEmbedResolvedWith(svg: string) {
    mockEmbed.mockResolvedValue({
        view: {
            run: jest.fn(),
            resize: jest.fn(),
            toSVG: jest.fn().mockResolvedValue(svg),
            finalize: jest.fn(),
        },
    });
}

describe('slideContentHasChartPlaceholder', () => {
    it('is false for plain slide markup', () => {
        expect(slideContentHasChartPlaceholder('<section><h2>Title</h2><p>Text</p></section>')).toBe(false);
    });

    it('is true once a chart placeholder is present', () => {
        expect(slideContentHasChartPlaceholder(`<section>${chartPlaceholder('{"mark":"bar"}')}</section>`)).toBe(true);
    });
});

describe('renderChartsInSlideContent', () => {
    beforeEach(() => {
        mockEmbed.mockReset();
    });

    it('returns chart-less content unchanged without calling vega-embed at all', async () => {
        const content = '<section><h2>No charts here</h2></section>';
        const result = await renderChartsInSlideContent(content);

        expect(result).toBe(content);
        expect(mockEmbed).not.toHaveBeenCalled();
    });

    it('replaces a valid chart placeholder with the pre-rendered SVG', async () => {
        mockEmbedResolvedWith('<svg>rendered chart</svg>');

        const spec = JSON.stringify({
            mark: 'bar',
            encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
            data: { values: [{ a: 'x', b: 1 }] },
        });
        const content = `<section><h2>Bloom season</h2>${chartPlaceholder(spec)}</section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toContain('<svg>rendered chart</svg>');
        expect(result).not.toContain('application/lumo-vega-lite+json');
        expect(mockEmbed).toHaveBeenCalledTimes(1);
    });

    it('falls back to an inert error node for one bad chart without touching the rest of the slide, or ever calling vega-embed for it', async () => {
        // No `values` and a `url` data source — rejected by the same sanitizeVegaSpec security
        // check chat-rendered charts already go through (external data sources are not allowed).
        const badSpec = JSON.stringify({ mark: 'bar', data: { url: 'https://example.com/data.json' } });
        const content = `<section><h2>Kept</h2>${chartPlaceholder(badSpec)}<p>Also kept</p></section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toContain('<h2>Kept</h2>');
        expect(result).toContain('<p>Also kept</p>');
        expect(result).toContain('Chart unavailable');
        expect(result).not.toContain('application/lumo-vega-lite+json');
        expect(mockEmbed).not.toHaveBeenCalled();
    });

    it('renders multiple charts on the same slide independently', async () => {
        mockEmbedResolvedWith('<svg>chart</svg>');

        const spec = JSON.stringify({ mark: 'bar', data: { values: [{ a: 1 }] } });
        const content = `<section>${chartPlaceholder(spec)}${chartPlaceholder(spec)}</section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result.match(/<svg>chart<\/svg>/g)).toHaveLength(2);
        expect(mockEmbed).toHaveBeenCalledTimes(2);
    });
});
