import { canUseNewModel, canUsePreviewModel } from '../util/userAgent.ts';

export type ModelTier = 'lumo-lite' | 'lumo-max' | 'apertus-15' | 'lumo-preview';
export type ResponseMode = 'fast' | 'thinking';

export const DEFAULT_MODEL_TIER: ModelTier = 'lumo-max';
export const DEFAULT_RESPONSE_MODE: ResponseMode = 'thinking';

export const getSelectedModelTier = (modelTier: ModelTier): ModelTier => {
    if (canUseNewModel()) {
        if (modelTier === 'lumo-preview' && !canUsePreviewModel()) {
            return 'lumo-lite';
        }
        return modelTier;
    } else {
        return modelTier === 'lumo-max' ? 'lumo-max' : 'lumo-lite';
    }
};
