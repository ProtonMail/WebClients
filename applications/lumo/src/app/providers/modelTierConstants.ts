export type ModelTier = 'auto' | 'lumo-lite' | 'lumo-max';
export type ResponseMode = 'fast' | 'thinking';

export const DEFAULT_MODEL_TIER: ModelTier = 'lumo-max';
export const DEFAULT_RESPONSE_MODE: ResponseMode = 'thinking';

export const getSelectedModelTier = (modelTier: ModelTier): Exclude<ModelTier, 'auto'> => {
    return modelTier === 'lumo-max' ? 'lumo-max' : 'lumo-lite';
};
