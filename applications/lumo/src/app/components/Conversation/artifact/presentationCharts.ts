import { looksLikeVegaSpec } from '../../LumoMarkdown/vega/detectVegaSpec';
import { renderVegaSpecToSvg } from '../../LumoMarkdown/vega/renderVegaSpecToSvg';
import { isVegaLanguage } from '../../LumoMarkdown/vega/vegaLanguages';
import { cardsToSlideFragment, parseArtifactCardFence } from './artifactVizCards';

// The model embeds a chart as a non-executing <script> block inside a <section> — browsers never
// execute a <script> whose `type` isn't a recognized JS MIME type (the same mechanism sites use
// for e.g. `application/ld+json`), so this is inert wherever it lands, including the DOMParser
// pass in buildArtifactDocument. It also avoids HTML-attribute quote-escaping entirely: the spec's own
// quotes/braces sit safely as text content instead of needing entity-escaping inside an attribute
// value, which matters given models already struggle with nested-quote content elsewhere in this
// tool (see DESIGN.md's duplicate-tool-call finding).
const CHART_PLACEHOLDER_TYPE = 'application/lumo-vega-lite+json';
const CHART_PLACEHOLDER_SELECTOR = `script[type="${CHART_PLACEHOLDER_TYPE}"]`;

// Chat-style fences the model sometimes writes into slide HTML despite the tool description (D12):
// ```vega-lite as loose text or inside <pre><code>, and ```card-row / ```card. Reveal shows them as raw
// text, so they are rewritten before rendering: charts become placeholders, cards become plain HTML.
const FENCE_IN_ELEMENT_PATTERN = /^\s*(`{3,}|~{3,})[ \t]*([A-Za-z][\w-]*)?([\s\S]*?)\1\s*$/;
const FENCE_IN_TEXT_PATTERN = /(`{3,}|~{3,})[ \t]*([A-Za-z][\w-]*)?([\s\S]*?)\1/g;
const CODE_LANGUAGE_CLASS_PATTERN = /(?:^|\s)language-([\w-]+)/;
const NEEDS_CLEANUP_PATTERN = /```|~~~|language-(?:vega|card)/i;
const CONTAINER_TAGS = new Set(['SECTION', 'BODY']);

/** Whether slide content needs the async chart pass (placeholders, or chat fences to rewrite). */
export function slideContentNeedsChartPass(content: string): boolean {
    return content.includes(CHART_PLACEHOLDER_TYPE) || NEEDS_CLEANUP_PATTERN.test(content);
}

function createChartPlaceholder(doc: Document, specJson: string): HTMLScriptElement {
    const script = doc.createElement('script');
    script.type = CHART_PLACEHOLDER_TYPE;
    script.textContent = specJson.trim();
    return script;
}

/** The slide-safe replacement for one fence, or null to leave it untouched. */
function replacementForFence(doc: Document, language: string, code: string): Node | null {
    const lang = language.toLowerCase();
    // Lenient on purpose: in a slide, raw spec JSON is never what the author wanted to show.
    if (isVegaLanguage(lang) || ((lang === '' || lang === 'json') && looksLikeVegaSpec(code))) {
        return createChartPlaceholder(doc, code);
    }

    const cards = parseArtifactCardFence(lang, code);
    if (cards) {
        return cardsToSlideFragment(doc, cards);
    }

    return null;
}

function readElementFence(element: Element): { language: string; code: string } | null {
    const text = element.textContent ?? '';
    const fence = text.match(FENCE_IN_ELEMENT_PATTERN);
    if (fence) {
        return { language: fence[2] ?? '', code: fence[3] ?? '' };
    }

    // <pre><code class="language-vega-lite">{...}</code></pre>, without backticks.
    const languageClass = element.tagName === 'CODE' ? element.className.match(CODE_LANGUAGE_CLASS_PATTERN) : null;
    if (languageClass) {
        return { language: languageClass[1]!, code: text };
    }

    return null;
}

/** Widen to the outermost wrapper (e.g. the <pre> around a <code>) that holds nothing but the fence. */
function outermostWrapper(element: Element): Element {
    let target = element;
    const text = (element.textContent ?? '').trim();
    while (
        target.parentElement &&
        !CONTAINER_TAGS.has(target.parentElement.tagName) &&
        (target.parentElement.textContent ?? '').trim() === text
    ) {
        target = target.parentElement;
    }
    return target;
}

function rewriteElementFences(doc: Document): boolean {
    let changed = false;
    // Reverse document order visits descendants before their ancestors, so the innermost element
    // holding a fence wins and its ancestors no longer match once it is replaced.
    const elements = Array.from(doc.body.querySelectorAll('*')).reverse();

    elements.forEach((element) => {
        if (!element.isConnected || CONTAINER_TAGS.has(element.tagName) || element.closest('svg, script, style')) {
            return;
        }
        const fence = readElementFence(element);
        const replacement = fence ? replacementForFence(doc, fence.language, fence.code) : null;
        if (replacement) {
            outermostWrapper(element).replaceWith(replacement);
            changed = true;
        }
    });

    return changed;
}

/** Fences sitting directly in a text node next to other text (e.g. straight inside a <section>). */
function rewriteTextNodeFences(doc: Document): boolean {
    let changed = false;
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.parentElement?.closest('script, style, svg')) {
            textNodes.push(node as Text);
        }
    }

    textNodes.forEach((textNode) => {
        const text = textNode.data;
        const fragment = doc.createDocumentFragment();
        let lastIndex = 0;
        let replacedAny = false;

        for (const match of text.matchAll(FENCE_IN_TEXT_PATTERN)) {
            const replacement = replacementForFence(doc, match[2] ?? '', match[3] ?? '');
            if (!replacement) {
                continue;
            }
            fragment.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
            fragment.appendChild(replacement);
            lastIndex = match.index + match[0].length;
            replacedAny = true;
        }

        if (replacedAny) {
            fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
            textNode.replaceWith(fragment);
            changed = true;
        }
    });

    return changed;
}

function appendRenderedSvg(targetDoc: Document, wrapper: HTMLElement, svg: string): void {
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = parsed.documentElement;

    if (root.tagName.toLowerCase() !== 'svg') {
        throw new Error('Expected SVG root element');
    }

    wrapper.appendChild(targetDoc.importNode(root, true));
}

/**
 * Prepares slide HTML for the sandboxed iframe and every slide export. First rewrites chat-style
 * fences (charts → placeholders, cards → plain HTML), then replaces every chart placeholder with its
 * pre-rendered, inert SVG. Runs entirely in the trusted parent app, before the content is ever
 * templated into the sandboxed iframe's srcDoc — the iframe never sees vega-lite, a JSON spec, or a
 * spec-interpreting runtime, only markup, exactly like a chart-less deck.
 *
 * A single malformed/rejected spec doesn't fail the whole deck: it's swapped for a small inert
 * fallback so the rest of the slide (and the rest of the deck) still renders. Content that needs
 * neither step is returned unchanged.
 */
export async function renderChartsInSlideContent(content: string): Promise<string> {
    if (!slideContentNeedsChartPass(content)) {
        return content;
    }

    const doc = new DOMParser().parseFromString(`<!doctype html><body>${content}`, 'text/html');
    const rewroteElements = rewriteElementFences(doc);
    const rewroteText = rewriteTextNodeFences(doc);
    const placeholders = Array.from(doc.body.querySelectorAll(CHART_PLACEHOLDER_SELECTOR));

    if (!rewroteElements && !rewroteText && placeholders.length === 0) {
        return content;
    }

    await Promise.all(
        placeholders.map(async (node) => {
            const wrapper = doc.createElement('div');
            try {
                wrapper.className = 'lumo-chart';
                appendRenderedSvg(doc, wrapper, await renderVegaSpecToSvg(node.textContent ?? ''));
            } catch {
                wrapper.className = 'lumo-chart-error';
                wrapper.textContent = 'Chart unavailable';
            }
            node.replaceWith(wrapper);
        })
    );

    return doc.body.innerHTML;
}
