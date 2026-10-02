import type { Element } from 'hast';

import { getCodeBlockLanguage } from '../../LumoMarkdown/vega/codeBlockUtils';
import { isVegaLanguage } from '../../LumoMarkdown/vega/vegaLanguages';

// Dependency-light chart helpers shared by the panel, the slide pass and the exports (D12). Rendering
// lives elsewhere (VegaLiteChart, renderVegaSpecToSvg) so importing this never pulls in vega.

// The model embeds a chart as a non-executing <script> block inside a <section> — browsers never
// execute a <script> whose `type` isn't a recognized JS MIME type (the same mechanism sites use
// for e.g. `application/ld+json`), so this is inert wherever it lands, including the DOMParser
// pass in buildArtifactDocument. It also avoids HTML-attribute quote-escaping entirely: the spec's own
// quotes/braces sit safely as text content instead of needing entity-escaping inside an attribute
// value, which matters given models already struggle with nested-quote content elsewhere in this
// tool (see DESIGN.md's duplicate-tool-call finding).
export const CHART_PLACEHOLDER_TYPE = 'application/lumo-vega-lite+json';
export const CHART_PLACEHOLDER_SELECTOR = `script[type="${CHART_PLACEHOLDER_TYPE}"]`;

/**
 * The placeholder as an HTML string, for producers that build markup as text (the document export's
 * markdown → HTML step). Every `<` is JSON-escaped so the spec can't close the <script> early; that is
 * only valid inside JSON strings, which is the only place `<` can appear in a valid spec.
 */
export function chartPlaceholderHtml(specJson: string): string {
    return `<script type="${CHART_PLACEHOLDER_TYPE}">${specJson.trim().replace(/</g, '\\u003c')}</script>`;
}

/**
 * Strict on purpose: only an explicitly labelled ```vega / ```vega-lite fence is a chart in a
 * document. Chat also sniffs ```json and unlabelled blocks for spec-like JSON, but a document may
 * quote a spec as an example, and that must stay code. Takes the hast `pre` node react-markdown passes.
 */
export function readArtifactChartFence(node: Element | undefined): { language: string; code: string } | null {
    const code = node?.children[0];
    if (!code || code.type !== 'element' || code.tagName !== 'code') {
        return null;
    }

    const language = getCodeBlockLanguage(undefined, code as { properties?: { className?: string[] } });
    if (!isVegaLanguage(language)) {
        return null;
    }

    const text = code.children
        .map((child) => {
            return child.type === 'text' ? child.value : '';
        })
        .join('')
        .replace(/\n$/, '');

    return { language, code: text };
}
