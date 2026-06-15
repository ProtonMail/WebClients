/**
 * Typed weights config for the OTP extractors. Mirrors the tuned `20260602`
 * weight set from the sandbox. Kept isolated so it reads like config and could be
 * sourced from YAML or a remote feature flag later without touching the runtime.
 *
 * Each extractor name maps to a weight; a weight of 0 (or a missing entry) means
 * the extractor is not executed at all (see `ACTIVE_EXTRACTORS` in the facade).
 */
export type ExtractorName =
    | 'title_ends_code'
    | 'title_mid_code'
    | 'title_split_code'
    | 'title_hyphenated_alpha_code'
    | 'title_ends_hyphenated_code'
    | 'body_html_num_code'
    | 'body_html_general_code'
    | 'body_visible_code'
    | 'body_visible_split_code'
    | 'body_edge_code'
    | 'body_plain_long_code'
    | 'body_plain_split_code'
    | 'body_plain_short_code'
    | 'body_colon_code'
    | 'body_isolated_code'
    | 'body_joined_code'
    | 'body_attr_code'
    | 'body_code_phrase_code'
    | 'body_hyphenated_alpha_code';

export const WEIGHTS: Record<ExtractorName, number> = {
    title_ends_code: 3,
    title_mid_code: 3,
    title_split_code: 3,
    title_hyphenated_alpha_code: 3,
    title_ends_hyphenated_code: 3,
    body_html_num_code: 4,
    body_html_general_code: 3,
    body_visible_code: 3,
    body_visible_split_code: 1,
    body_edge_code: 4,
    body_plain_long_code: 0,
    body_plain_split_code: 0,
    body_plain_short_code: 1,
    body_colon_code: 1,
    body_isolated_code: 5,
    body_joined_code: 1,
    body_attr_code: 2,
    body_code_phrase_code: 5,
    body_hyphenated_alpha_code: 0,
};
