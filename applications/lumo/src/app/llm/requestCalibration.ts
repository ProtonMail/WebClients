import { useSyncExternalStore } from 'react';

/**
 * Per-conversation ratio between the backend's real prompt size and our local
 * ~4-chars/token estimate of the same request. Code, JSON and non-Latin text
 * tokenize far denser than the estimate, so budgets divide by this ratio.
 *
 * In-memory only and numbers only: nothing here is persisted or reported.
 */

export const DEFAULT_CALIBRATION = 1.15;
const MIN_CALIBRATION = 1;
const MAX_CALIBRATION = 2;
/** Weight of a new sample against the running ratio. */
const SMOOTHING = 0.5;
/** Applied when an overflow carries no parsable token count. */
const OVERFLOW_STEP = 1.25;

const ratios = new Map<string, number>();
const listeners = new Set<() => void>();
let revision = 0;

function clamp(ratio: number): number {
    return Math.min(MAX_CALIBRATION, Math.max(MIN_CALIBRATION, ratio));
}

function publish(conversationId: string, ratio: number) {
    ratios.set(conversationId, clamp(ratio));
    revision += 1;
    listeners.forEach((listener) => listener());
}

export function getCalibration(conversationId: string | undefined): number {
    return (conversationId && ratios.get(conversationId)) || DEFAULT_CALIBRATION;
}

/** Record the backend-reported prompt size of a request we estimated at `estimatedTokens`. */
export function recordPromptUsage(conversationId: string, estimatedTokens: number, promptTokens: number) {
    if (!(estimatedTokens > 0) || !(promptTokens > 0)) {
        return;
    }
    const sample = promptTokens / estimatedTokens;
    const current = ratios.get(conversationId);
    publish(conversationId, current === undefined ? sample : current * (1 - SMOOTHING) + sample * SMOOTHING);
}

/**
 * Parse the prompt size from an upstream overflow message, e.g. vLLM's
 * "…maximum context length is 131072 tokens. However, you requested 140000 tokens
 * (139000 in the messages, 1000 in the completion)". The "in the messages" figure is
 * the prompt alone; without it, "requested" is the closest available.
 */
export function parseRequestedTokens(upstreamMessage: string | undefined): number | undefined {
    if (!upstreamMessage) {
        return undefined;
    }
    const match = /(\d+)\s+in the messages/i.exec(upstreamMessage) ?? /requested\s+(\d+)\s+tokens/i.exec(upstreamMessage);
    const value = match ? Number(match[1]) : NaN;
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Record that a request we estimated at `estimatedTokens` overflowed. Uses the real size
 * when the upstream message carries it, otherwise steps the ratio up so the retry is smaller.
 */
export function recordOverflow(conversationId: string, estimatedTokens: number, upstreamMessage?: string) {
    const requested = parseRequestedTokens(upstreamMessage);
    const current = getCalibration(conversationId);
    if (requested && estimatedTokens > 0) {
        publish(conversationId, Math.max(current, requested / estimatedTokens));
        return;
    }
    publish(conversationId, current * OVERFLOW_STEP);
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Re-render when any conversation's calibration changes; read the value with {@link getCalibration}. */
export function useCalibrationRevision(): number {
    return useSyncExternalStore(
        subscribe,
        () => revision,
        () => revision
    );
}