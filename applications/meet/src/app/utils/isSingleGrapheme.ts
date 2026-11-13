// Older browsers in the support range (Chrome < 87, Safari 14.0) have no `Intl.Segmenter`.
const graphemeSegmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : undefined;

// Without a segmenter, bound the code points instead: a flag with tags (🏴󠁧󠁢󠁥󠁮󠁧󠁿) or a family has 7.
const FALLBACK_MAX_CODE_POINTS = 10;

/**
 * Matches meet-core's reaction rule, `emoji.graphemes(true).count() == 1`: exactly one extended grapheme cluster.
 * `String.length` counts UTF-16 code units, so it rejects single emojis such as 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (14) or 👨‍👩‍👧‍👦 (11).
 */
export const isSingleGrapheme = (value: string) => {
    if (!value) {
        return false;
    }

    if (!graphemeSegmenter) {
        return [...value].length <= FALLBACK_MAX_CODE_POINTS;
    }

    const segments = graphemeSegmenter.segment(value)[Symbol.iterator]();
    return !segments.next().done && !!segments.next().done;
};
