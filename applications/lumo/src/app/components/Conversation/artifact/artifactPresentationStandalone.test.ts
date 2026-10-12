import { buildStandalonePresentationHtml } from './artifactPresentationStandalone';

jest.mock('reveal.js/dist/reveal.js', () => ({ __esModule: true, default: 'window.Reveal = {};' }), { virtual: true });
jest.mock('reveal.js/dist/reveal.css', () => ({ __esModule: true, default: '.reveal {}' }), { virtual: true });
jest.mock('reveal.js/dist/theme/simple.css', () => ({ __esModule: true, default: '.simple-theme {}' }), {
    virtual: true,
});
jest.mock('./presentationCharts', () => ({
    renderChartsInSlideContent: jest.fn(async (content: string) => {
        return content.replace('<!--chart-->', '<div class="lumo-chart"><svg></svg></div>');
    }),
    slideContentNeedsChartPass: jest.fn(() => false),
}));

const deck = {
    id: 'deck-1',
    type: 'presentation' as const,
    title: 'Q3 <Board> Update',
    content: '<section><h2>Café résumé</h2><!--chart--></section><section><h2>Two</h2></section>',
};

describe('buildStandalonePresentationHtml', () => {
    it('inlines reveal.js, its stylesheet, the theme, and the slides into one document', async () => {
        const html = await buildStandalonePresentationHtml(deck);

        expect(html).toContain('window.Reveal = {};');
        expect(html).toContain('.reveal {}');
        expect(html).toContain('.simple-theme {}');
        expect(html).toContain('Reveal.initialize');
        expect(html).toContain('<h2>Café résumé</h2>');
        expect(html).toContain('<h2>Two</h2>');
    });

    it('declares a charset and an escaped title so the file renders correctly from disk', async () => {
        const html = await buildStandalonePresentationHtml(deck);

        expect(html).toContain('<meta charset="utf-8">');
        expect(html).toContain('<title>Q3 &lt;Board&gt; Update</title>');
        expect(html.indexOf('<meta charset="utf-8">')).toBeLessThan(html.indexOf('<style>'));
    });

    it('pre-renders charts instead of shipping the chart spec', async () => {
        const html = await buildStandalonePresentationHtml(deck);

        expect(html).toContain('class="lumo-chart"');
        expect(html).not.toContain('<!--chart-->');
    });

    it('does not include the preview shell bridge script', async () => {
        const html = await buildStandalonePresentationHtml(deck);

        expect(html).not.toContain('postMessage');
    });
});
