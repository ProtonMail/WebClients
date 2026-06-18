import { CONTEXT_LIMITS } from '../utils';

/**
 * Target context size (in estimated tokens) that compaction tries to get the
 * summarized region under. We aim well below the hard model limit so the
 * freshly compacted conversation has room to grow again before re-compacting.
 */
export const COMPACTION_TARGET_TOKENS = Math.round(CONTEXT_LIMITS.MAX_CONTEXT * 0.5); // ~64K

/**
 * Recent conversation tail that is always preserved verbatim (never summarized),
 * expressed as an estimated-token budget. The most recent user question is always
 * kept regardless of this budget.
 */
export const KEEP_RECENT_TOKEN_BUDGET = 24_000;

/** Minimum number of recent messages to preserve verbatim after the boundary. */
export const KEEP_MIN_RECENT_MESSAGES = 2;

/**
 * When clearing old tool results, keep this many of the most recent tool results
 * in the summarized region intact (mirrors Claude Code's microcompaction keepRecent).
 */
export const KEEP_RECENT_TOOL_RESULTS = 2;

/** Placeholder substituted for cleared tool-result content. */
export const CLEARED_TOOL_RESULT_PLACEHOLDER = '[Old tool result cleared to reclaim context]';

/** Upper bound on how much reduced transcript we send to the LLM summarizer. */
export const MAX_SUMMARY_INPUT_TOKENS = 90_000;

/** Flat token estimate per image turn (image bytes are not counted as text). */
export const IMAGE_TOKEN_ESTIMATE = 2_000;

/**
 * When the estimated request size (history + expanded attachments) reaches this
 * threshold, compaction runs pre-emptively *before* sending — rather than
 * waiting for the backend to reject an over-budget request. Set just below the
 * model window so we compact before hitting the wall.
 */
export const PROACTIVE_COMPACTION_THRESHOLD_TOKENS = Math.round(CONTEXT_LIMITS.MAX_CONTEXT * 0.9); // ~115K
