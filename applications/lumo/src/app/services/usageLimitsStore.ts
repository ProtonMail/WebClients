import { useSyncExternalStore } from 'react';

import type { ModelTier } from '../providers/modelTierConstants';
import { getSelectedModelTier } from '../providers/modelTierConstants';
import type { MaxModelAvailability } from '../remote/nativeComposerBridge';
import type { GenerationResponseMessage, LumoRemainingLimits } from '../types-api';

type Listener = () => void;

/** The Debug View can force either unavailable state; `null` means "no override, use the real one". */
export type DebugMaxModelOverride = Exclude<MaxModelAvailability, 'available'>;

const DEBUG_MAX_AVAILABILITY_KEY = 'lumo_debug_max_availability';
const DEBUG_MODEL_LIMITS_EXHAUSTED_KEY = 'lumo_debug_weekly_limit_exhausted';

const readPersistedMaxOverride = (): DebugMaxModelOverride | null => {
    try {
        const stored = localStorage.getItem(DEBUG_MAX_AVAILABILITY_KEY);
        return stored === 'unavailable_high_load' || stored === 'unavailable_limit_reached' ? stored : null;
    } catch {
        return null;
    }
};

const readPersistedModelLimitsExhausted = (): boolean => {
    try {
        return localStorage.getItem(DEBUG_MODEL_LIMITS_EXHAUSTED_KEY) === 'true';
    } catch {
        return false;
    }
};

let remainingLimits: LumoRemainingLimits | null = null;
let remainingLimitsRevision = 0;
export type ExhaustedLimitNotice = {
    limitCategory: 'lite' | 'max';
    modelTier: UsageModelTier;
};
let exhaustedLimitNotice: ExhaustedLimitNotice | null = null;
let debugMaxOverride = readPersistedMaxOverride();
let debugModelLimitsExhausted = readPersistedModelLimitsExhausted();
/**
 * What consumers actually observe: the backend limits with any debug override applied.
 * Cached so `useSyncExternalStore` keeps seeing a stable reference between updates.
 */
let effectiveLimits: LumoRemainingLimits | null = null;
const listeners = new Set<Listener>();

export type UsageModelTier = ModelTier;

function computeEffectiveLimits(): LumoRemainingLimits | null {
    if (debugModelLimitsExhausted) {
        return { ...(remainingLimits ?? {}), lite: 0, max: 0 };
    }

    // With no backend limits yet, an override still has to produce an object — a `null`
    // snapshot means "unknown", which every selectability check treats as "allowed".
    if (debugMaxOverride === 'unavailable_limit_reached') {
        return { ...(remainingLimits ?? {}), max: 0 };
    }

    return remainingLimits;
}

function publish(): void {
    effectiveLimits = computeEffectiveLimits();
    listeners.forEach((listener) => listener());
}

publish();

type SetRemainingLimitsOptions = {
    appliedLimitCategory?: string;
    modelTier?: UsageModelTier;
};

const toLimitCategory = (category: string | undefined): 'lite' | 'max' | undefined => {
    return category === 'lite' || category === 'max' ? category : undefined;
};

export function getLimitCategoryForTier(modelTier: UsageModelTier): 'lite' | 'max' {
    return modelTier === 'lumo-max' ? 'max' : 'lite';
}

export function getTierForLimitCategory(category: 'lite' | 'max'): UsageModelTier {
    return category === 'max' ? 'lumo-max' : 'lumo-lite';
}

export function setRemainingLimits(limits: LumoRemainingLimits, options: SetRemainingLimitsOptions = {}): void {
    const previousLimits = remainingLimits;
    remainingLimits = limits;
    remainingLimitsRevision += 1;

    const appliedLimitCategory = toLimitCategory(options.appliedLimitCategory);
    if (
        appliedLimitCategory &&
        limits[appliedLimitCategory] === 0 &&
        previousLimits?.[appliedLimitCategory] !== 0
    ) {
        exhaustedLimitNotice = {
            limitCategory: appliedLimitCategory,
            modelTier: options.modelTier ?? getTierForLimitCategory(appliedLimitCategory),
        };
    } else if (
        exhaustedLimitNotice &&
        typeof limits[exhaustedLimitNotice.limitCategory] === 'number' &&
        limits[exhaustedLimitNotice.limitCategory]! > 0
    ) {
        exhaustedLimitNotice = null;
    }

    publish();
}

export function getRemainingLimits(): LumoRemainingLimits | null {
    return effectiveLimits;
}

export function getRemainingLimitsRevision(): number {
    return remainingLimitsRevision;
}

function subscribeRemainingLimits(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useRemainingLimits(): LumoRemainingLimits | null {
    return useSyncExternalStore(subscribeRemainingLimits, getRemainingLimits, getRemainingLimits);
}

export function getExhaustedLimitNotice(): ExhaustedLimitNotice | null {
    return exhaustedLimitNotice;
}

export function useExhaustedLimitNotice(): ExhaustedLimitNotice | null {
    return useSyncExternalStore(subscribeRemainingLimits, getExhaustedLimitNotice, getExhaustedLimitNotice);
}

export function markModelLimitExhausted(limitCategory: 'lite' | 'max', modelTier: UsageModelTier): void {
    exhaustedLimitNotice = { limitCategory, modelTier };
    publish();
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

/**
 * Debug View only: forces every chat-model pool to zero so the model-limit upsell
 * can be previewed without waiting for a real quota exhaustion.
 */
export function setDebugModelLimitsExhausted(exhausted: boolean): void {
    debugModelLimitsExhausted = exhausted;
    if (exhausted) {
        exhaustedLimitNotice = { limitCategory: 'lite', modelTier: 'lumo-lite' };
    } else if (
        exhaustedLimitNotice &&
        remainingLimits?.[exhaustedLimitNotice.limitCategory] !== 0
    ) {
        exhaustedLimitNotice = null;
    }
    try {
        if (exhausted) {
            localStorage.setItem(DEBUG_MODEL_LIMITS_EXHAUSTED_KEY, 'true');
        } else {
            localStorage.removeItem(DEBUG_MODEL_LIMITS_EXHAUSTED_KEY);
        }
    } catch {
        // Storage unavailable — the override still applies for this session.
    }
    publish();
}

export function getDebugModelLimitsExhausted(): boolean {
    return debugModelLimitsExhausted;
}

export function useDebugModelLimitsExhausted(): boolean {
    return useSyncExternalStore(subscribeRemainingLimits, getDebugModelLimitsExhausted, getDebugModelLimitsExhausted);
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
    limitUpsellVisible: boolean;
    messageCount: number;
    isMaxAvailableByFlag: boolean;
};

/** Whether the model-switch upsell applies at all (ignores in-flight generation). */
export function isModelSwitchSuggestionEligible({
    hasLumoPlus,
    selectedModelTier,
    remainingLimits,
    limitUpsellVisible,
    messageCount,
    isMaxAvailableByFlag,
}: ModelSwitchSuggestionArgs): boolean {
    if (hasLumoPlus || limitUpsellVisible || !remainingLimits || !isMaxAvailableByFlag) {
        return false;
    }

    if (selectedModelTier !== 'lumo-lite' && selectedModelTier !== 'apertus-15') {
        return false;
    }

    if (isLimitExhausted(remainingLimits.max)) {
        return false;
    }

    // Apertus intentionally remains selected when its shared Lite pool is exhausted, rather than
    // automatically switching to Max. Surface the existing Max switch card so the user can choose.
    if (selectedModelTier === 'apertus-15' && isLimitExhausted(remainingLimits.lite)) {
        return true;
    }

    if (isLimitExhausted(remainingLimits.lite)) {
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

    return limits[getLimitCategoryForTier(modelTier)];
}

export function isModelTierLimitExhausted(modelTier: UsageModelTier, limits: LumoRemainingLimits | null): boolean {
    return isLimitExhausted(getRemainingForModelTier(modelTier, limits));
}

export type ModelTierAvailabilityOptions = {
    isMaxAvailable?: boolean;
    isApertusEnabled?: boolean;
};

export function isModelTierSelectable(
    modelTier: UsageModelTier,
    limits: LumoRemainingLimits | null,
    options?: ModelTierAvailabilityOptions
): boolean {
    if (modelTier === 'lumo-max' && options?.isMaxAvailable === false) {
        return false;
    }

    if (modelTier === 'apertus-15' && options?.isApertusEnabled === false) {
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

    if (selected === 'apertus-15' && options?.isApertusEnabled === false) {
        return 'lumo-lite';
    }

    // Apertus shares Lite's quota but must not consume or select the Max pool.
    if (selected === 'apertus-15') {
        return selected;
    }

    const alternative: UsageModelTier = selected === 'lumo-max' ? 'lumo-lite' : 'lumo-max';

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

/** True when either chat-model pool reported by the backend is exhausted. */
export function isAnyModelLimitExhausted(limits: LumoRemainingLimits | null): boolean {
    if (!limits) {
        return false;
    }

    return isLimitExhausted(limits.lite) || isLimitExhausted(limits.max);
}

/** Returns the exhausted pool only when the other chat model still has quota. */
export function getDismissibleExhaustedModel(limits: LumoRemainingLimits | null): 'lite' | 'max' | undefined {
    if (limits?.lite === 0 && typeof limits.max === 'number' && limits.max > 0) {
        return 'lite';
    }
    if (limits?.max === 0 && typeof limits.lite === 'number' && limits.lite > 0) {
        return 'max';
    }
    return undefined;
}

export function getExhaustedLimitForModel(
    limits: LumoRemainingLimits | null,
    modelTier: UsageModelTier | undefined
): ExhaustedLimitNotice | null {
    if (!limits || !modelTier) {
        return null;
    }

    const limitCategory = getLimitCategoryForTier(modelTier);
    return limits[limitCategory] === 0 ? { limitCategory, modelTier } : null;
}

export function shouldShowLimitUpsell(
    remainingLimits: LumoRemainingLimits | null,
    hasTierErrors: boolean,
    hasLumoPlus: boolean,
    selectedModelTier: UsageModelTier
): boolean {
    return (
        !hasLumoPlus &&
        hasTierErrors &&
        isModelTierLimitExhausted(selectedModelTier, remainingLimits)
    );
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

export function applyUsageFromStreamMessage(
    message: GenerationResponseMessage,
    modelTier?: UsageModelTier
): void {
    if (message.type !== 'usage' || !message.usage.remaining_limits) {
        return;
    }

    setRemainingLimits(message.usage.remaining_limits, {
        appliedLimitCategory: message.usage.applied_limit_category,
        modelTier,
    });
}
