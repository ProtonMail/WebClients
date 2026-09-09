import { buildRevealTemplate, injectSlides } from './PresentationRenderer';
import { buildArtifactDocument } from './WebpageRenderer';

// `vega-embed` ships ESM-only and isn't wired into this repo's Jest transform allowlist — mocked
// here purely so importing PresentationRenderer.tsx (which now pulls in presentationCharts.ts,
// see presentationCharts.test.ts for its own coverage) doesn't fail to parse in this file, which
// only exercises the pure template/CSP functions below and never touches chart rendering.
jest.mock('vega-embed', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

function parse(srcDoc: string): Document {
    return new DOMParser().parseFromString(srcDoc, 'text/html');
}

describe('buildRevealTemplate + injectSlides', () => {
    const revealJs = 'window.Reveal = { initialize: function () { window.__initialized = true; } };';
    const revealCss = '.reveal { color: red; }';
    const themeCss = '.reveal .slides { font-family: sans-serif; }';

    it('embeds the app-supplied library/theme and the model slide content into one document', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const doc = parse(injectSlides(template, '<section>Slide 1</section><section>Slide 2</section>'));

        const slides = doc.querySelector('.reveal .slides');
        expect(slides?.querySelectorAll('section')).toHaveLength(2);
        expect(slides?.textContent).toContain('Slide 1');

        const styles = Array.from(doc.querySelectorAll('style')).map((el) => el.textContent);
        expect(styles).toContain(revealCss);
        expect(styles).toContain(themeCss);

        const scripts = Array.from(doc.querySelectorAll('script')).map((el) => el.textContent);
        expect(scripts.some((s) => s?.includes('window.Reveal'))).toBe(true);
        expect(scripts.some((s) => s?.includes('Reveal.initialize('))).toBe(true);
    });

    it("gives html/body an explicit height so reveal.css's `.reveal { height: 100% }` has a definite ancestor to resolve against in embedded mode", () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const doc = parse(injectSlides(template, '<section>Slide 1</section>'));

        expect(doc.documentElement.querySelector('head > style')?.textContent).toContain('height: 100%');
    });

    it('does not apply special $-substitution when slide content contains a literal "$1"-shaped string', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const doc = parse(injectSlides(template, '<section>Price is $1 per unit, save $$5</section>'));

        expect(doc.querySelector('.reveal .slides')?.textContent).toBe('Price is $1 per unit, save $$5');
    });

    it('still gets the resize/error bridge script injected into <head> once passed through buildArtifactDocument', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const combined = injectSlides(template, '<section>Slide 1</section>');

        const doc = parse(buildArtifactDocument(combined));

        const bridgeScript = Array.from(doc.head.querySelectorAll('script')).find((el) =>
            el.textContent?.includes('lumo-resize')
        );
        expect(bridgeScript).toBeDefined();

        // The html/body sizing <style>, plus the reveal.js library/theme <style> tags, and
        // <script> tags must still be present alongside the injected bridge script —
        // buildArtifactDocument must not clobber them.
        expect(doc.querySelectorAll('style')).toHaveLength(3);
        expect(Array.from(doc.querySelectorAll('script')).some((s) => s.textContent?.includes('window.Reveal'))).toBe(
            true
        );
    });

    it('a decoy "<head>"-shaped comment in slide content is left untouched (same head-parsing safety as webpage artifacts)', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const combined = injectSlides(template, '<section><!-- <head> --> Slide with a decoy comment</section>');

        const doc = parse(buildArtifactDocument(combined));

        expect(
            Array.from(doc.head.querySelectorAll('script')).some((el) => el.textContent?.includes('lumo-resize'))
        ).toBe(true);
        expect(doc.querySelector('.slides')?.textContent).toContain('Slide with a decoy comment');
    });
});
