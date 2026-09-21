import { buildPresentationSlidesHtml, extractPresentationSlideFragments } from './artifactPresentationHtml';

describe('extractPresentationSlideFragments', () => {
    it('wraps non-section content in a single slide page', () => {
        expect(extractPresentationSlideFragments('<h2>Title</h2><p>Body</p>')).toEqual([
            '<section class="artifact-slide-page"><h2>Title</h2><p>Body</p></section>',
        ]);
    });

    it('adds artifact-slide-page to top-level sections', () => {
        const fragments = extractPresentationSlideFragments(
            '<section><h2>One</h2></section><section><h2>Two</h2></section>'
        );

        expect(fragments).toHaveLength(2);
        expect(fragments[0]).toContain('class="artifact-slide-page"');
        expect(fragments[0]).toContain('One');
        expect(fragments[1]).toContain('Two');
    });

    it('keeps nested sections inside their parent slide', () => {
        const fragments = extractPresentationSlideFragments(
            '<section><h2>Stack</h2><section><p>Nested</p></section></section>'
        );

        expect(fragments).toHaveLength(1);
        expect(fragments[0]).toContain('Nested');
        expect(fragments[0].match(/class="artifact-slide-page"/g)).toHaveLength(1);
    });

    it('returns an empty array for blank content', () => {
        expect(extractPresentationSlideFragments('   ')).toEqual([]);
    });
});

describe('buildPresentationSlidesHtml', () => {
    it('joins slide fragments', () => {
        const html = buildPresentationSlidesHtml('<section><h2>One</h2></section><section><h2>Two</h2></section>');

        expect(html).toContain('artifact-slide-page');
        expect(html).toContain('One');
        expect(html).toContain('Two');
    });
});
