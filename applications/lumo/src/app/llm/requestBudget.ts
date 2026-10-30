import type { LumoApiModelTier } from '@proton/lumo-api-client/core/chat-completions';

import { type ContextLimits, DEFAULT_CONTEXT_LIMITS, deriveContextLimits } from './contextLimits';
import { getContextLimitsForModelTier } from './modelContextLimits';
import { DEFAULT_CALIBRATION, getCalibration } from './requestCalibration';

/** Share of the window kept free for the reply. */
const OUTPUT_RESERVE_RATIO = 0.1;
const MIN_OUTPUT_RESERVE_TOKENS = 8_000;
/** Thinking replies spend tens of thousands of tokens before any visible output. */
const MIN_REASONING_OUTPUT_RESERVE_TOKENS = 25_000;
/** Never let the reply reservation starve the prompt on small windows. */
const MAX_OUTPUT_RESERVE_RATIO = 0.25;

/** Verbatim recent history kept by compaction, as a share of the input budget. */
const KEEP_RECENT_RATIO = 0.2;
/** Size history is compacted down to (summary + recent tail), as a share of the input budget. */
const COMPACTION_TARGET_RATIO = 0.5;

/**
 * Turns the file budget does not see when it is computed: system prompt, personalization,
 * memories, project and skill instructions, tool definitions.
 */
export const REQUEST_OVERHEAD_TOKEN_ALLOWANCE = 4_000;

/**
 * Token budget for one request against one model window. Every size decision on the send
 * path (when to compact, how far, how much file content fits) and the context indicator
 * derive from the same value, so they cannot disagree.
 *
 * Token figures are in local-estimate units (see `countTokens`): the real window is divided
 * by the conversation's calibration ratio so that local estimates can be compared directly.
 */
export type RequestBudget = {
    /** Model `max_context_length`, in real tokens. */
    window: number;
    /** Real tokens kept free for the reply (reasoning + visible output). */
    reservedOutput: number;
    calibration: number;
    /** Largest request, in estimate units, that still leaves `reservedOutput` free. */
    inputBudget: number;
    /** Verbatim tail compaction preserves. */
    keepRecentTokens: number;
    /** Summary + tail size compaction aims for, leaving room for files and growth. */
    compactionTargetTokens: number;
};

export function getReservedOutputTokens(window: number, reasoning: boolean): number {
    const floor = reasoning ? MIN_REASONING_OUTPUT_RESERVE_TOKENS : MIN_OUTPUT_RESERVE_TOKENS;
    const reserve = Math.max(window * OUTPUT_RESERVE_RATIO, floor);
    return Math.round(Math.min(reserve, window * MAX_OUTPUT_RESERVE_RATIO));
}

export function getRequestBudget({
    limits = DEFAULT_CONTEXT_LIMITS,
    reasoning = false,
    calibration = DEFAULT_CALIBRATION,
}: {
    limits?: ContextLimits;
    reasoning?: boolean;
    calibration?: number;
} = {}): RequestBudget {
    const window = limits.MAX_CONTEXT;
    const reservedOutput = getReservedOutputTokens(window, reasoning);
    const inputBudget = Math.max(1, Math.floor((window - reservedOutput) / calibration));
    return {
        window,
        reservedOutput,
        calibration,
        inputBudget,
        keepRecentTokens: Math.round(inputBudget * KEEP_RECENT_RATIO),
        compactionTargetTokens: Math.round(inputBudget * COMPACTION_TARGET_RATIO),
    };
}

/** Budget for a send or for the indicator, from the model tier and the conversation's calibration. */
export function resolveRequestBudget({
    modelTier,
    reasoning,
    conversationId,
}: {
    modelTier?: LumoApiModelTier;
    reasoning?: boolean;
    conversationId?: string;
}): RequestBudget {
    return getRequestBudget({
        limits: getContextLimitsForModelTier(modelTier),
        reasoning: !!reasoning,
        calibration: getCalibration(conversationId),
    });
}

/**
 * File content allowed on a request whose history (summary, messages, tool blocks) is
 * `historyTokens`. Never floored above what is left: a floor here would plan an over-window
 * request whenever history is large. When nothing is left, compaction makes room instead.
 */
export function getFileTokenBudget(budget: RequestBudget, historyTokens: number): number {
    return Math.max(0, budget.inputBudget - REQUEST_OVERHEAD_TOKEN_ALLOWANCE - Math.max(0, historyTokens));
}

/**
 * Indicator limits in real tokens: the window minus the reply reservation, so 100% means
 * the next request can no longer fit, not that the raw window is full.
 */
export function getDisplayContextLimits(budget: RequestBudget): ContextLimits {
    return deriveContextLimits(budget.window - budget.reservedOutput);
}
