import { resolveChatModel, type LumoApiModelTier } from '@proton/lumo-api-client/core/chat-completions';

import {
    DEFAULT_CONTEXT_LIMITS,
    type ContextLimits,
    type ContextWindowConfig,
    deriveContextLimits,
    getContextWindowConfig,
} from './contextLimits';
import { getMaxContextLengthForModelId } from '../services/modelsStore';

export function getContextLimitsForModelId(modelId: string): ContextLimits {
    const maxContextLength = getMaxContextLengthForModelId(modelId);
    if (typeof maxContextLength !== 'number' || !Number.isFinite(maxContextLength) || maxContextLength <= 0) {
        return DEFAULT_CONTEXT_LIMITS;
    }
    return deriveContextLimits(maxContextLength);
}

export function getContextLimitsForModelTier(modelTier: LumoApiModelTier | undefined): ContextLimits {
    return getContextLimitsForModelId(resolveChatModel(modelTier ?? 'auto'));
}

export function getContextWindowConfigForModelTier(modelTier: LumoApiModelTier | undefined): ContextWindowConfig {
    return getContextWindowConfig(getContextLimitsForModelTier(modelTier));
}
