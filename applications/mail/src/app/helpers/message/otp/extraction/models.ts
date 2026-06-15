// Registry of all extractors used at runtime, in priority order.
import type { ExtractorName } from '../config';
import type { Extractor } from './extractors';
import {
    bodyAttr,
    bodyCodePhrase,
    bodyColon,
    bodyEdge,
    bodyHtmlGeneral,
    bodyHtmlNum,
    bodyHyphenatedAlpha,
    bodyIsolated,
    bodyJoined,
    bodyPlainLong,
    bodyPlainShort,
    bodyPlainSplit,
    bodyVisible,
    bodyVisibleSplit,
    titleEnds,
    titleEndsHyphenated,
    titleHyphenatedAlpha,
    titleMid,
    titleSplit,
} from './extractors';

// Keyed by name so a newly-added ExtractorName is a compile error until it is
// registered here. Insertion order is the runtime priority order.
const EXTRACTOR_BY_NAME: Record<ExtractorName, Extractor> = {
    title_ends_code: titleEnds,
    title_mid_code: titleMid,
    title_split_code: titleSplit,
    title_hyphenated_alpha_code: titleHyphenatedAlpha,
    title_ends_hyphenated_code: titleEndsHyphenated,
    body_html_num_code: bodyHtmlNum,
    body_html_general_code: bodyHtmlGeneral,
    body_visible_code: bodyVisible,
    body_visible_split_code: bodyVisibleSplit,
    body_edge_code: bodyEdge,
    body_plain_long_code: bodyPlainLong,
    body_plain_split_code: bodyPlainSplit,
    body_plain_short_code: bodyPlainShort,
    body_colon_code: bodyColon,
    body_isolated_code: bodyIsolated,
    body_joined_code: bodyJoined,
    body_attr_code: bodyAttr,
    body_code_phrase_code: bodyCodePhrase,
    body_hyphenated_alpha_code: bodyHyphenatedAlpha,
};

export const EXTRACTORS: Extractor[] = Object.values(EXTRACTOR_BY_NAME);
