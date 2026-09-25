import { useMemo } from 'react';

import type { LumoApiModelTier } from '@proton/lumo-api-client/core/chat-completions';

import type { ContextLimits, ContextWindowConfig } from '../llm/contextLimits';
import { getContextLimitsForModelTier, getContextWindowConfigForModelTier } from '../llm/modelContextLimits';
import { getSelectedModelTier, useModelTier } from '../providers/ModelTierProvider';
import { useModelsRevision } from '../services/modelsStore';

export function useContextLimits(modelTierOverride?: LumoApiModelTier): ContextLimits {
    const { modelTier } = useModelTier();
    const modelsRevision = useModelsRevision();

    return useMemo(() => {
        const tier = modelTierOverride ?? getSelectedModelTier(modelTier);
        return getContextLimitsForModelTier(tier);
    }, [modelTier, modelTierOverride, modelsRevision]);
}

/** Model window plus derived compaction and file budgets — single source for UI and send paths. */
export function useContextWindowConfig(modelTierOverride?: LumoApiModelTier): ContextWindowConfig {
    const { modelTier } = useModelTier();
    const modelsRevision = useModelsRevision();

    return useMemo(() => {
        const tier = modelTierOverride ?? getSelectedModelTier(modelTier);
        return getContextWindowConfigForModelTier(tier);
    }, [modelTier, modelTierOverride, modelsRevision]);
}
