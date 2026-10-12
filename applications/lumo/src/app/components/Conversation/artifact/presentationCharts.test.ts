import { renderChartsInSlideContent, slideContentNeedsChartPass } from './presentationCharts';

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

describe('slideContentNeedsChartPass', () => {
    it('is false for plain slide markup', () => {
        expect(slideContentNeedsChartPass('<section><h2>Title</h2><p>Text</p></section>')).toBe(false);
    });

    it('is true once a chart placeholder is present', () => {
        expect(slideContentNeedsChartPass(`<section>${chartPlaceholder('{"mark":"bar"}')}</section>`)).toBe(true);
    });

    it('is true for a chat-style fence that needs rewriting', () => {
        expect(slideContentNeedsChartPass('<section><p>```vega-lite {}```</p></section>')).toBe(true);
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

    it('falls back when vega returns non-SVG output', async () => {
        mockEmbedResolvedWith('not an svg');

        const spec = JSON.stringify({ mark: 'bar', data: { values: [{ a: 1 }] } });
        const content = `<section>${chartPlaceholder(spec)}</section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toContain('Chart unavailable');
        expect(mockEmbed).toHaveBeenCalledTimes(1);
    });
});

// D12: chat-style fences written into slide HTML are rewritten instead of shown as raw text.
describe('renderChartsInSlideContent — chat fence cleanup', () => {
    const spec = JSON.stringify({
        mark: 'bar',
        encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
        data: { values: [{ a: 'x', b: 1 }] },
    });

    beforeEach(() => {
        mockEmbed.mockReset();
        mockEmbedResolvedWith('<svg>fence chart</svg>');
    });

    it('renders a vega-lite fence written as loose paragraph text', async () => {
        const content = `<section><h2>Kept</h2><p>\`\`\`vega-lite ${spec} \`\`\`</p></section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toContain('<h2>Kept</h2>');
        expect(result).toContain('<div class="lumo-chart"><svg>fence chart</svg></div>');
        expect(result).not.toContain('```');
        expect(result).not.toContain('<p>');
    });

    it('replaces the whole <pre> around a fenced <code> block', async () => {
        const content = `<section><pre><code>\`\`\`vega-lite\n${spec}\n\`\`\`</code></pre></section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toBe('<section><div class="lumo-chart"><svg>fence chart</svg></div></section>');
    });

    it('renders <code class="language-vega-lite"> without backticks', async () => {
        const content = `<section><pre><code class="language-vega-lite">${spec}</code></pre></section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toBe('<section><div class="lumo-chart"><svg>fence chart</svg></div></section>');
    });

    it('splits a fence out of a text node that also holds other text', async () => {
        const content = `<section>Before \`\`\`vega-lite\n${spec}\n\`\`\` after</section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toBe('<section>Before <div class="lumo-chart"><svg>fence chart</svg></div> after</section>');
    });

    it('turns a card-row fence into a plain list and a card fence into a quote', async () => {
        const cardRow = JSON.stringify([
            { type: 'metric', title: 'Accounts', value: '100M+', delta: 'Consumer scale', direction: 'up' },
            { type: 'metric', title: 'Revenue', value: '>$100M', direction: 'flat' },
        ]);
        const card = JSON.stringify({ type: 'finding', title: 'The tension', body: 'Scale without depth.' });
        const content = `<section><pre><code>\`\`\`card-row\n${cardRow}\n\`\`\`</code></pre><p>\`\`\`card ${card}\`\`\`</p></section>`;

        const result = await renderChartsInSlideContent(content);

        expect(result).toBe(
            '<section><ul><li><strong>Accounts</strong>: 100M+ (Consumer scale)</li><li><strong>Revenue</strong>: &gt;$100M</li></ul>' +
                '<blockquote><strong>The tension</strong>: Scale without depth.</blockquote></section>'
        );
        expect(mockEmbed).not.toHaveBeenCalled();
    });

    it('leaves other fenced code on a slide untouched', async () => {
        const content = '<section><pre><code>```python\nprint("hi")\n```</code></pre></section>';

        const result = await renderChartsInSlideContent(content);

        expect(result).toBe(content);
        expect(mockEmbed).not.toHaveBeenCalled();
    });
});
