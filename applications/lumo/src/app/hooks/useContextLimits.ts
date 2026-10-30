import { useMemo } from 'react';

import type { LumoApiModelTier } from '@proton/lumo-api-client/core/chat-completions';

import type { ContextLimits } from '../llm/contextLimits';
import { useCalibrationRevision } from '../llm/requestCalibration';
import { type RequestBudget, getDisplayContextLimits, resolveRequestBudget } from '../llm/requestBudget';
import { getSelectedModelTier, useModelTier } from '../providers/ModelTierProvider';
import { useModelsRevision } from '../services/modelsStore';

/** Budget the next request of this conversation would be sized against — same as the send path. */
export function useRequestBudget(conversationId?: string, modelTierOverride?: LumoApiModelTier): RequestBudget {
    const { modelTier, isThinkingEnabled } = useModelTier();
    const modelsRevision = useModelsRevision();
    const calibrationRevision = useCalibrationRevision();

    return useMemo(
        () =>
            resolveRequestBudget({
                modelTier: modelTierOverride ?? getSelectedModelTier(modelTier),
                reasoning: isThinkingEnabled,
                conversationId,
            }),
        [modelTier, modelTierOverride, isThinkingEnabled, conversationId, modelsRevision, calibrationRevision]
    );
}

/** Indicator limits in real tokens: the model window minus the room reserved for the reply. */
export function useContextLimits(conversationId?: string, modelTierOverride?: LumoApiModelTier): ContextLimits {
    const budget = useRequestBudget(conversationId, modelTierOverride);
    return useMemo(() => getDisplayContextLimits(budget), [budget]);
}
