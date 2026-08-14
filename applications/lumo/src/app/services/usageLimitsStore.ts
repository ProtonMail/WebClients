import { useSyncExternalStore } from 'react';

import type { ModelTier } from '../providers/modelTierConstants';
import { getSelectedModelTier } from '../providers/modelTierConstants';
import type { GenerationResponseMessage, LumoRemainingLimits } from '../types-api';

type Listener = () => void;

let remainingLimits: LumoRemainingLimits | null = null;
const listeners = new Set<Listener>();

export type UsageModelTier = Exclude<ModelTier, 'auto'>;

export function setRemainingLimits(limits: LumoRemainingLimits): void {
    remainingLimits = limits;
    listeners.forEach((listener) => listener());
}

export function getRemainingLimits(): LumoRemainingLimits | null {
    return remainingLimits;
}

function subscribeRemainingLimits(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useRemainingLimits(): LumoRemainingLimits | null {
    return useSyncExternalStore(subscribeRemainingLimits, getRemainingLimits, getRemainingLimits);
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
