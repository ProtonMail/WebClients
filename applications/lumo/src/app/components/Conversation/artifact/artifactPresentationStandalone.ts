import { buildRevealTemplate, injectSlides } from './PresentationRenderer';
import { escapeHtml } from './artifactHtmlDocument';
import type { ParsedArtifact } from './parseArtifacts';
import { renderChartsInSlideContent } from './presentationCharts';

/**
 * Add what a file opened straight from disk needs but the preview shell supplies itself: a charset
 * (without it, non-ASCII slide text is mis-decoded from file://), a viewport, and the deck title.
 */
function withStandaloneHead(deckHtml: string, title: string): string {
    // The template's own <head> is the first one in the document — slide content is only injected
    // later, inside <body> — so this can't match a "<head>" string in model content.
    return deckHtml.replace('<head>', () => {
        return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>`;
    });
}

/**
 * Build a self-contained HTML deck (reveal.js, its stylesheet, and the theme inlined; charts pre-rendered
 * to SVG) that opens and presents offline, the same way the panel preview does. Unlike the preview, it
 * gets none of the shell's bridge script, since there is no parent frame to talk to.
 */
export async function buildStandalonePresentationHtml(artifact: ParsedArtifact): Promise<string> {
    const [{ default: revealJs }, { default: revealCss }, { default: themeCss }, slideContent] = await Promise.all([
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/reveal.js'),
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/reveal.css'),
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/theme/simple.css'),
        renderChartsInSlideContent(artifact.content),
    ]);

    const deckHtml = injectSlides(buildRevealTemplate(revealJs, revealCss, themeCss), slideContent);

    return withStandaloneHead(deckHtml, artifact.title);
}
