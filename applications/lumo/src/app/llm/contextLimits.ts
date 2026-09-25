export type ContextLimits = {
    WARNING_THRESHOLD: number;
    DANGER_THRESHOLD: number;
    MAX_CONTEXT: number;
};

/** Fallback limits when model metadata is not yet loaded or unknown. */
export const DEFAULT_CONTEXT_LIMITS: ContextLimits = {
    WARNING_THRESHOLD: 110_000,
    DANGER_THRESHOLD: 120_000,
    MAX_CONTEXT: 130_000,
} as const;

/** Context window size the default warning/danger ratios were tuned against. */
export const DEFAULT_MAX_CONTEXT_LENGTH = DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT;

const WARNING_RATIO = DEFAULT_CONTEXT_LIMITS.WARNING_THRESHOLD / DEFAULT_MAX_CONTEXT_LENGTH;
const DANGER_RATIO = DEFAULT_CONTEXT_LIMITS.DANGER_THRESHOLD / DEFAULT_MAX_CONTEXT_LENGTH;

/** @deprecated Use DEFAULT_CONTEXT_LIMITS or model-specific limits from useContextLimits. */
export const CONTEXT_LIMITS = DEFAULT_CONTEXT_LIMITS;

export function deriveContextLimits(maxContextLength: number): ContextLimits {
    const maxContext = Math.max(1, Math.round(maxContextLength));
    return {
        MAX_CONTEXT: maxContext,
        WARNING_THRESHOLD: Math.round(maxContext * WARNING_RATIO),
        DANGER_THRESHOLD: Math.round(maxContext * DANGER_RATIO),
    };
}

export function getCompactionTargetTokens(limits: ContextLimits): number {
    return Math.round(limits.MAX_CONTEXT * 0.5);
}

export function getProactiveCompactionThresholdTokens(limits: ContextLimits): number {
    return Math.round(limits.MAX_CONTEXT * 0.9);
}

export function getRequestInputTokenBudget(limits: ContextLimits = DEFAULT_CONTEXT_LIMITS): number {
    return Math.round(limits.MAX_CONTEXT * 0.78);
}

export function getContextSizeWarning(
    tokenCount: number,
    limits: ContextLimits = DEFAULT_CONTEXT_LIMITS
): 'none' | 'warning' | 'danger' | 'critical' {
    if (tokenCount >= limits.MAX_CONTEXT) {
        return 'critical';
    }
    if (tokenCount >= limits.DANGER_THRESHOLD) {
        return 'danger';
    }
    if (tokenCount >= limits.WARNING_THRESHOLD) {
        return 'warning';
    }
    return 'none';
}

export function getContextUsagePercentage(tokenCount: number, limits: ContextLimits = DEFAULT_CONTEXT_LIMITS): number {
    return Math.min(100, Math.round((tokenCount / limits.MAX_CONTEXT) * 100));
}

/** Allowance for turns the chain does not account for: system prompt, personalization, memories, instructions. */
export const REQUEST_OVERHEAD_TOKEN_ALLOWANCE = 4_000;

/** Never starve the current question of file content, even when history is large. */
export const MIN_FILE_TOKEN_BUDGET = 8_000;

/**
 * Derived budgets and compaction thresholds for a model context window.
 * Use this (or `getContextWindowConfig`) so compaction, file caps, and UI stay in sync.
 */
export type ContextWindowConfig = {
    limits: ContextLimits;
    requestInputTokenBudget: number;
    compactionTargetTokens: number;
    proactiveCompactionThresholdTokens: number;
};

export function getContextWindowConfig(limits: ContextLimits = DEFAULT_CONTEXT_LIMITS): ContextWindowConfig {
    return {
        limits,
        requestInputTokenBudget: getRequestInputTokenBudget(limits),
        compactionTargetTokens: getCompactionTargetTokens(limits),
        proactiveCompactionThresholdTokens: getProactiveCompactionThresholdTokens(limits),
    };
}

/** Default-window compaction/file budgets (legacy 130K tuning). Prefer model-specific config in product code. */
export const DEFAULT_CONTEXT_WINDOW_CONFIG = getContextWindowConfig(DEFAULT_CONTEXT_LIMITS);

/**
 * Token allowance for expanded file content on the next request.
 *
 * Compaction can only shrink message text; a file-heavy tail can still exceed the window on its own.
 */
export function computeFileTokenBudget(
    conversationTokens: number,
    limits: ContextLimits = DEFAULT_CONTEXT_LIMITS
): number {
    const inputBudget = getRequestInputTokenBudget(limits);
    const remaining = inputBudget - REQUEST_OVERHEAD_TOKEN_ALLOWANCE - Math.max(0, conversationTokens);
    return Math.max(MIN_FILE_TOKEN_BUDGET, remaining);
}
