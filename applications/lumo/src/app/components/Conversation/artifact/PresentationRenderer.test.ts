import { buildRevealTemplate, injectSlides } from './PresentationRenderer';
import { buildSandboxedDoc } from './WebpageRenderer';

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

    it('still gets the CSP injected as the first head child once passed through buildSandboxedDoc', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const combined = injectSlides(template, '<section>Slide 1</section>');

        const doc = parse(buildSandboxedDoc(combined));

        const cspMeta = doc.head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
        expect(cspMeta).not.toBeNull();
        expect(doc.head.firstElementChild?.getAttribute('http-equiv')?.toLowerCase()).toBe('content-security-policy');

        // The html/body sizing <style>, plus the reveal.js library/theme <style> tags, and
        // <script> tags must still be present alongside the injected CSP/bridge script —
        // buildSandboxedDoc must not clobber them.
        expect(doc.querySelectorAll('style')).toHaveLength(3);
        expect(Array.from(doc.querySelectorAll('script')).some((s) => s.textContent?.includes('window.Reveal'))).toBe(
            true
        );
    });

    it('a decoy "<head>"-shaped comment in slide content does not defeat the CSP (same protection as webpage artifacts)', () => {
        const template = buildRevealTemplate(revealJs, revealCss, themeCss);
        const combined = injectSlides(template, '<section><!-- <head> --> Slide with a decoy comment</section>');

        const doc = parse(buildSandboxedDoc(combined));

        expect(doc.head.querySelector('meta[http-equiv="Content-Security-Policy" i]')).not.toBeNull();
        expect(doc.querySelector('.slides')?.textContent).toContain('Slide with a decoy comment');
    });
});
