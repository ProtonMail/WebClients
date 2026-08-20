import { useSyncExternalStore } from 'react';

import type { ModelTier } from '../providers/modelTierConstants';
import { getSelectedModelTier } from '../providers/modelTierConstants';
import type { MaxModelAvailability } from '../remote/nativeComposerBridge';
import type { GenerationResponseMessage, LumoRemainingLimits } from '../types-api';

type Listener = () => void;

/** The Debug View can force either unavailable state; `null` means "no override, use the real one". */
export type DebugMaxModelOverride = Exclude<MaxModelAvailability, 'available'>;

const DEBUG_MAX_AVAILABILITY_KEY = 'lumo_debug_max_availability';

const readPersistedMaxOverride = (): DebugMaxModelOverride | null => {
    try {
        const stored = localStorage.getItem(DEBUG_MAX_AVAILABILITY_KEY);
        return stored === 'unavailable_high_load' || stored === 'unavailable_limit_reached' ? stored : null;
    } catch {
        return null;
    }
};

let remainingLimits: LumoRemainingLimits | null = null;
let debugMaxOverride = readPersistedMaxOverride();
/**
 * What consumers actually observe: the backend limits with any debug override applied.
 * Cached so `useSyncExternalStore` keeps seeing a stable reference between updates.
 */
let effectiveLimits: LumoRemainingLimits | null = null;
const listeners = new Set<Listener>();

export type UsageModelTier = Exclude<ModelTier, 'auto'>;

function publish(): void {
    // With no backend limits yet, an override still has to produce an object — a `null`
    // snapshot means "unknown", which every selectability check treats as "allowed".
    effectiveLimits =
        debugMaxOverride === 'unavailable_limit_reached' ? { ...(remainingLimits ?? {}), max: 0 } : remainingLimits;

    listeners.forEach((listener) => listener());
}

publish();

export function setRemainingLimits(limits: LumoRemainingLimits): void {
    remainingLimits = limits;
    publish();
}

export function getRemainingLimits(): LumoRemainingLimits | null {
    return effectiveLimits;
}

function subscribeRemainingLimits(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useRemainingLimits(): LumoRemainingLimits | null {
    return useSyncExternalStore(subscribeRemainingLimits, getRemainingLimits, getRemainingLimits);
}

/**
 * Debug View only: forces Max into one of its unavailable states, so both branches can be
 * exercised without burning a real quota or waiting for a high-load rollout.
 *
 * `unavailable_limit_reached` pins the Max pool to zero here; `unavailable_high_load` is applied
 * by `useMaxModelAvailability`, since that path is driven by feature flags rather than quota.
 * Persisted so it survives the reloads a WebView goes through.
 */
export function setDebugMaxModelOverride(override: DebugMaxModelOverride | null): void {
    debugMaxOverride = override;
    try {
        if (override) {
            localStorage.setItem(DEBUG_MAX_AVAILABILITY_KEY, override);
        } else {
            localStorage.removeItem(DEBUG_MAX_AVAILABILITY_KEY);
        }
    } catch {
        // Storage unavailable (private mode / wrapper) — the override still applies for this session.
    }
    publish();
}

export function getDebugMaxModelOverride(): DebugMaxModelOverride | null {
    return debugMaxOverride;
}

export function useDebugMaxModelOverride(): DebugMaxModelOverride | null {
    return useSyncExternalStore(subscribeRemainingLimits, getDebugMaxModelOverride, getDebugMaxModelOverride);
}

export function isLimitExhausted(remaining: number | undefined): boolean {
    return remaining === 0;
}

/** Show the remaining-count indicator when at zero or down to this many requests left. */
export const LOW_REMAINING_LIMIT_THRESHOLD = 5;

export function isLimitLow(remaining: number | undefined): boolean {
    return remaining !== undefined && remaining > 0 && remaining <= LOW_REMAINING_LIMIT_THRESHOLD;
}

export function shouldShowRemainingLimitIndicator(remaining: number | undefined): boolean {
    if (remaining === undefined) {
        return false;
    }

    return isLimitExhausted(remaining) || isLimitLow(remaining);
}

export type ModelSwitchSuggestionArgs = {
    hasLumoPlus: boolean;
    selectedModelTier: UsageModelTier;
    remainingLimits: LumoRemainingLimits | null;
    weeklyLimitUpsellVisible: boolean;
    messageCount: number;
    isMaxAvailableByFlag: boolean;
};

/** Whether the model-switch upsell applies at all (ignores in-flight generation). */
export function isModelSwitchSuggestionEligible({
    hasLumoPlus,
    selectedModelTier,
    remainingLimits,
    weeklyLimitUpsellVisible,
    messageCount,
    isMaxAvailableByFlag,
}: ModelSwitchSuggestionArgs): boolean {
    if (hasLumoPlus || weeklyLimitUpsellVisible || !remainingLimits || !isMaxAvailableByFlag) {
        return false;
    }

    if (selectedModelTier !== 'lumo-lite') {
        return false;
    }

    if (isLimitExhausted(remainingLimits.lite) || isLimitExhausted(remainingLimits.max)) {
        return false;
    }

    return messageCount >= 2;
}

export function shouldShowModelSwitchSuggestion({
    isGenerating,
    ...args
}: ModelSwitchSuggestionArgs & { isGenerating: boolean }): boolean {
    return isModelSwitchSuggestionEligible(args) && !isGenerating;
}

export function getRemainingForModelTier(
    modelTier: UsageModelTier,
    limits: LumoRemainingLimits | null
): number | undefined {
    if (!limits) {
        return undefined;
    }

    return modelTier === 'lumo-max' ? limits.max : limits.lite;
}

export function isModelTierLimitExhausted(modelTier: UsageModelTier, limits: LumoRemainingLimits | null): boolean {
    return isLimitExhausted(getRemainingForModelTier(modelTier, limits));
}

export type ModelTierAvailabilityOptions = {
    isMaxAvailable?: boolean;
};

export function isModelTierSelectable(
    modelTier: UsageModelTier,
    limits: LumoRemainingLimits | null,
    options?: ModelTierAvailabilityOptions
): boolean {
    if (modelTier === 'lumo-max' && options?.isMaxAvailable === false) {
        return false;
    }

    if (!limits) {
        return true;
    }

    return !isModelTierLimitExhausted(modelTier, limits);
}

/**
 * Whether Max can be picked right now, and why not when it can't — the single derivation behind
 * both the web picker's badge and the value pushed over the native bridge.
 *
 * High load wins over an exhausted quota when both apply: it's the segment-wide state, and
 * `ModelModePanel` labels the row the same way, so native and web never disagree.
 */
export function getMaxModelAvailability(
    limits: LumoRemainingLimits | null,
    options?: ModelTierAvailabilityOptions
): MaxModelAvailability {
    if (options?.isMaxAvailable === false) {
        return 'unavailable_high_load';
    }

    if (isModelTierLimitExhausted('lumo-max', limits)) {
        return 'unavailable_limit_reached';
    }

    return 'available';
}

/** Default model tier: max when selectable, otherwise lite. */
export function resolveDefaultModelTier(
    limits: LumoRemainingLimits | null,
    options?: ModelTierAvailabilityOptions
): UsageModelTier {
    if (isModelTierSelectable('lumo-max', limits, options)) {
        return 'lumo-max';
    }

    return 'lumo-lite';
}

/** Prefer the current model when available; otherwise switch to the other tier if it has quota. */
export function resolveAvailableModelTier(
    currentTier: ModelTier,
    limits: LumoRemainingLimits | null,
    options?: ModelTierAvailabilityOptions
): UsageModelTier {
    const selected = getSelectedModelTier(currentTier);

    if (isModelTierSelectable(selected, limits, options)) {
        return selected;
    }

    const alternative: UsageModelTier = selected === 'lumo-lite' ? 'lumo-max' : 'lumo-lite';

    if (isModelTierSelectable(alternative, limits, options)) {
        return alternative;
    }

    return selected;
}

/** True when every limit reported by the backend is zero. */
export function areAllModelLimitsExhausted(limits: LumoRemainingLimits | null): boolean {
    if (!limits) {
        return false;
    }

    const knownLimits = [limits.lite, limits.max].filter((remaining) => remaining !== undefined);
    if (knownLimits.length === 0) {
        return false;
    }

    return knownLimits.every((remaining) => remaining === 0);
}

export function shouldShowWeeklyLimitUpsell(
    remainingLimits: LumoRemainingLimits | null,
    hasTierErrors: boolean,
    hasLumoPlus: boolean
): boolean {
    return !hasLumoPlus && hasTierErrors && remainingLimits !== null && areAllModelLimitsExhausted(remainingLimits);
}

/** @deprecated Use isModelTierLimitExhausted for the selected model tier. */
export function isChatLimitExhausted(limits: LumoRemainingLimits | null): boolean {
    return isModelTierLimitExhausted('lumo-lite', limits);
}

export function resolveUsageModelTier(modelTier: ModelTier | undefined): UsageModelTier | undefined {
    if (!modelTier) {
        return undefined;
    }

    return getSelectedModelTier(modelTier);
}

export function applyUsageFromStreamMessage(message: GenerationResponseMessage): void {
    if (message.type !== 'usage' || !message.usage.remaining_limits) {
        return;
    }

    setRemainingLimits(message.usage.remaining_limits);
}

/**
 * Marks model pools as exhausted when the API rejects a request due to tier limits
 * (e.g. HTTP 429) before SSE usage data is available.
 */
export function applyTierLimitRejectionFromApi(): void {
    const current = remainingLimits ?? {};

    setRemainingLimits({
        ...current,
        lite: 0,
        max: 0,
    });
}
