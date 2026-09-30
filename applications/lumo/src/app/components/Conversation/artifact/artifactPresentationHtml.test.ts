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

    it('splits a vertical stack into one slide per nested section', () => {
        const fragments = extractPresentationSlideFragments(
            '<section><section><h2>First</h2></section><section><h2>Second</h2></section></section><section><h2>Third</h2></section>'
        );

        expect(fragments).toHaveLength(3);
        expect(fragments[0]).toContain('First');
        expect(fragments[0]).not.toContain('Second');
        expect(fragments[1]).toContain('Second');
        expect(fragments[2]).toContain('Third');
        fragments.forEach((fragment) => {
            expect(fragment.match(/class="artifact-slide-page"/g)).toHaveLength(1);
        });
    });

    it('keeps content placed directly in a vertical stack as a leading slide', () => {
        const fragments = extractPresentationSlideFragments(
            '<section><h2>Stack intro</h2><section><p>Nested</p></section></section>'
        );

        expect(fragments).toHaveLength(2);
        expect(fragments[0]).toContain('Stack intro');
        expect(fragments[0]).not.toContain('Nested');
        expect(fragments[1]).toContain('Nested');
    });

    it('does not add an empty leading slide for a whitespace-only stack wrapper', () => {
        const fragments = extractPresentationSlideFragments(
            '<section>\n  <section><p>A</p></section>\n  <section><p>B</p></section>\n</section>'
        );

        expect(fragments).toHaveLength(2);
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
