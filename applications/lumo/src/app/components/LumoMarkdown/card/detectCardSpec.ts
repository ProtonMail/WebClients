import { looksLikeVegaSpec, looksLikeVegaSpecPartial } from '../vega/detectVegaSpec';
import { isVegaLanguage } from '../vega/vegaLanguages';
import { CARD_TYPES } from './cardTypes';

const CARD_TYPE_PATTERN = new RegExp(`"type"\\s*:\\s*"(${CARD_TYPES.join('|')})"`);
const OPEN_CARD_FENCE_PATTERN = /```(card-row|card|json)\s*\n/g;

function isCardTypeObject(trimmed: string): boolean {
    if (!CARD_TYPE_PATTERN.test(trimmed)) {
        return false;
    }

    if (/"type"\s*:\s*"summary"/.test(trimmed) && /"body"\s*:\s*"/.test(trimmed)) {
        return true;
    }

    if (!/"title"\s*:\s*"/.test(trimmed)) {
        return false;
    }

    // Exclude Vega-Lite specs that may appear in ```json fences.
    if (/vega\.github\.io\/schema\/vega(-lite)?/i.test(trimmed)) {
        return false;
    }

    if (/"mark"\s*:/.test(trimmed) && /"encoding"\s*:/.test(trimmed)) {
        return false;
    }

    return true;
}

export function isCardRowLanguage(language: string): boolean {
    return language.toLowerCase() === 'card-row';
}

export function isCardLanguage(language: string): boolean {
    return language.toLowerCase() === 'card' || isCardRowLanguage(language);
}

export function looksLikeCardSpec(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed.startsWith('{')) {
        return false;
    }

    return isCardTypeObject(trimmed);
}

/** Partial/incomplete JSON while streaming. */
export function looksLikeCardSpecPartial(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed.startsWith('{')) {
        return false;
    }

    if (/vega\.github\.io\/schema\/vega(-lite)?/i.test(trimmed)) {
        return false;
    }

    if (/"mark"\s*:/.test(trimmed) && /"encoding"\s*:/.test(trimmed)) {
        return false;
    }

    if (looksLikeVegaSpecPartial(trimmed) || looksLikeVegaSpec(trimmed)) {
        return false;
    }

    return (
        CARD_TYPE_PATTERN.test(trimmed) ||
        (/"type"\s*:\s*"summary"/.test(trimmed) && /"body"\s*:\s*"/.test(trimmed))
    );
}

export function looksLikeMetricCardPartial(code: string): boolean {
    return looksLikeCardSpecPartial(code) && /"type"\s*:\s*"metric"/.test(code);
}

export function shouldRenderAsCard(language: string, code: string): boolean {
    if (isVegaLanguage(language)) {
        return false;
    }

    if (looksLikeVegaSpec(code) || looksLikeVegaSpecPartial(code)) {
        return false;
    }

    if (isCardLanguage(language)) {
        return true;
    }

    if (language === 'json' && looksLikeCardSpecPartial(code)) {
        return true;
    }

    return looksLikeCardSpec(code);
}

export function splitAroundOpenCardCodeFence(content: string): {
    prefix: string;
    language: string;
    body: string;
} | null {
    const matches = [...content.matchAll(OPEN_CARD_FENCE_PATTERN)];
    if (matches.length === 0) {
        return null;
    }

    const lastMatch = matches[matches.length - 1];
    const fenceStart = lastMatch.index ?? 0;
    const language = lastMatch[1]?.toLowerCase() ?? 'card';
    const bodyStart = fenceStart + lastMatch[0].length;
    const body = content.slice(bodyStart);

    if (body.includes('\n```')) {
        return null;
    }

    if (!looksLikeCardSpecPartial(body) && !isCardLanguage(language)) {
        return null;
    }

    return {
        prefix: content.slice(0, fenceStart),
        language,
        body,
    };
}
