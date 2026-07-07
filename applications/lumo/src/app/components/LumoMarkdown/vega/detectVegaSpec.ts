import { isVegaLanguage } from './vegaLanguages';

const VEGA_GITHUB_SCHEMA_PATTERN = /vega\.github\.io\/schema\/vega(-lite)?/i;
const VEGA_SCHEMA_MENTION_PATTERN = /"\$schema"\s*:\s*"[^"]*vega/i;
const VEGA_COMPOSITION_PATTERN = /"(layer|hconcat|vconcat|concat|facet|repeat|spec)"\s*:/;
const OPEN_VEGA_FENCE_PATTERN = /```(json|vega-lite|vega)\s*\n/g;

/**
 * Heuristic detection for Vega/Vega-Lite JSON when the model omits the `vega-lite`
 * fence language (e.g. uses `json` instead) or uses a malformed $schema URL.
 */
export function looksLikeVegaSpec(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed.startsWith('{')) {
        return false;
    }

    if (/"type"\s*:\s*"(metric|finding|summary)"/.test(trimmed) && /"title"\s*:/.test(trimmed)) {
        return false;
    }

    if (VEGA_GITHUB_SCHEMA_PATTERN.test(trimmed)) {
        return true;
    }

    if (VEGA_SCHEMA_MENTION_PATTERN.test(trimmed)) {
        return true;
    }

    if (VEGA_COMPOSITION_PATTERN.test(trimmed)) {
        return true;
    }

    const hasMark = /"mark"\s*:/.test(trimmed);
    const hasEncoding = /"encoding"\s*:/.test(trimmed);
    const hasVegaFullSpec = /"(marks|signals|scales|axes)"\s*:/.test(trimmed);

    if ((hasMark && hasEncoding) || hasVegaFullSpec) {
        return true;
    }

    const hasInlineValues = /"values"\s*:\s*\[/.test(trimmed);
    const hasChartLayout = /"(width|height|title|encoding|layer|mark)"\s*:/.test(trimmed);

    return hasInlineValues && hasChartLayout;
}

/** Partial/incomplete JSON while streaming — looser checks than the final spec. */
export function looksLikeVegaSpecPartial(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed.startsWith('{')) {
        return false;
    }

    return (
        VEGA_SCHEMA_MENTION_PATTERN.test(trimmed) ||
        VEGA_COMPOSITION_PATTERN.test(trimmed) ||
        /"mark"\s*:/.test(trimmed) ||
        /"encoding"\s*:/.test(trimmed) ||
        (/"values"\s*:\s*\[/.test(trimmed) && /"(width|height|title)"\s*:/.test(trimmed))
    );
}

export function shouldRenderAsVegaChart(language: string, code: string): boolean {
    if (isVegaLanguage(language)) {
        return true;
    }

    if (language === 'json' && looksLikeVegaSpecPartial(code)) {
        return true;
    }

    return looksLikeVegaSpec(code);
}

export function splitAroundOpenVegaCodeFence(content: string): {
    prefix: string;
    language: string;
    body: string;
} | null {
    const matches = [...content.matchAll(OPEN_VEGA_FENCE_PATTERN)];
    if (matches.length === 0) {
        return null;
    }

    const lastMatch = matches[matches.length - 1];
    const fenceStart = lastMatch.index ?? 0;
    const language = lastMatch[1]?.toLowerCase() ?? 'json';
    const bodyStart = fenceStart + lastMatch[0].length;
    const body = content.slice(bodyStart);

    if (body.includes('\n```')) {
        return null;
    }

    if (!looksLikeVegaSpecPartial(body) && !isVegaLanguage(language)) {
        return null;
    }

    return {
        prefix: content.slice(0, fenceStart),
        language,
        body,
    };
}

export function hasOpenVegaCodeFence(content: string): boolean {
    return splitAroundOpenVegaCodeFence(content) !== null;
}
