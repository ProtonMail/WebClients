import { createContext, useContext } from 'react';

import type { ModelTier, ResponseMode } from './modelTierConstants';

export interface ModelTierContextType {
    modelTier: ModelTier;
    setModelTier: (mode: ModelTier) => void;
    setModelTierWithoutPersist: (mode: ModelTier) => void;
    responseMode: ResponseMode;
    setResponseMode: (mode: ResponseMode) => void;
    setResponseModeWithoutPersist: (mode: ResponseMode) => void;
    isThinkingEnabled: boolean;
}

export const ModelTierContext = createContext<ModelTierContextType | undefined>(undefined);

export const useModelTier = (): ModelTierContextType => {
    const context = useContext(ModelTierContext);
    if (context === undefined) {
        throw new Error('useModelTier must be used within a ModelTierProvider');
    }
    return context;
};

export const useOptionalModelTier = (): ModelTierContextType | undefined => {
    return useContext(ModelTierContext);
};
