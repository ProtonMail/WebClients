import { type ParsedDeck, parseDeck } from './deck';

/**
 * A `presentation` artifact's content is either a JSON deck (D18) or, for decks made before it
 * and while `LumoArtifactSlides` is off, reveal.js `<section>` HTML. The two are told apart by
 * shape: HTML never starts with `{`.
 */

// Models sometimes wrap the JSON in a ```json fence.
const CODE_FENCE = /^\s*```[\w-]*\s*\n([\s\S]*?)\n\s*```\s*$/;

const unwrapFence = (content: string): string => {
    return content.match(CODE_FENCE)?.[1] ?? content;
};

export const looksLikeDeckJson = (content: string): boolean => {
    return unwrapFence(content).trimStart().startsWith('{');
};

const cache = new Map<string, ParsedDeck>();
const CACHE_LIMIT = 20;

/** The parsed deck, or null for HTML decks. Parsed decks are cached because every surface reads the same content. */
export const readDeckContent = (content: string): ParsedDeck | null => {
    if (!looksLikeDeckJson(content)) {
        return null;
    }
    const cached = cache.get(content);
    if (cached) {
        return cached;
    }
    const parsed = parseDeck(unwrapFence(content));
    if (cache.size >= CACHE_LIMIT) {
        cache.delete(cache.keys().next().value!);
    }
    cache.set(content, parsed);
    return parsed;
};

/** True for a presentation whose content is a JSON deck, readable or not. */
export const isDeckArtifact = (artifact: { type: string; content: string }): boolean => {
    return artifact.type === 'presentation' && looksLikeDeckJson(artifact.content);
};
