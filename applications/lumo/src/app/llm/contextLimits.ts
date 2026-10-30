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
const DEFAULT_MAX_CONTEXT_LENGTH = DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT;

const WARNING_RATIO = DEFAULT_CONTEXT_LIMITS.WARNING_THRESHOLD / DEFAULT_MAX_CONTEXT_LENGTH;
const DANGER_RATIO = DEFAULT_CONTEXT_LIMITS.DANGER_THRESHOLD / DEFAULT_MAX_CONTEXT_LENGTH;

export function deriveContextLimits(maxContextLength: number): ContextLimits {
    const maxContext = Math.max(1, Math.round(maxContextLength));
    return {
        MAX_CONTEXT: maxContext,
        WARNING_THRESHOLD: Math.round(maxContext * WARNING_RATIO),
        DANGER_THRESHOLD: Math.round(maxContext * DANGER_RATIO),
    };
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
