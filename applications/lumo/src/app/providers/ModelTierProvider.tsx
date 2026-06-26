import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { ModelTierLimitsSync } from './ModelTierLimitsSync';

export type ModelTier = 'auto' | 'lumo-lite' | 'lumo-max';
export type ResponseMode = 'fast' | 'thinking';

export const DEFAULT_MODEL_TIER: ModelTier = 'lumo-max';
export const DEFAULT_RESPONSE_MODE: ResponseMode = 'thinking';

interface ModelTierContextType {
    modelTier: ModelTier;
    setModelTier: (mode: ModelTier) => void;
    responseMode: ResponseMode;
    setResponseMode: (mode: ResponseMode) => void;
    isThinkingEnabled: boolean;
}

const ModelTierContext = createContext<ModelTierContextType | undefined>(undefined);

interface ModelTierProviderProps {
    children: ReactNode;
}

export const ModelTierProvider = ({ children }: ModelTierProviderProps) => {
    const [modelTier, setModelTierState] = useState<ModelTier>(DEFAULT_MODEL_TIER);
    const [responseMode, setResponseModeState] = useState<ResponseMode>(DEFAULT_RESPONSE_MODE);

    const setModelTier = useCallback((mode: ModelTier) => {
        setModelTierState(mode);
    }, []);

    const setResponseMode = useCallback((mode: ResponseMode) => {
        setResponseModeState(mode);
    }, []);

    const value: ModelTierContextType = {
        modelTier: modelTier,
        setModelTier: setModelTier,
        responseMode: responseMode,
        setResponseMode: setResponseMode,
        isThinkingEnabled: responseMode === 'thinking',
    };

    return (
        <ModelTierContext.Provider value={value}>
            <ModelTierLimitsSync />
            {children}
        </ModelTierContext.Provider>
    );
};

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

export const getSelectedModelTier = (modelTier: ModelTier): Exclude<ModelTier, 'auto'> => {
    return modelTier === 'lumo-max' ? 'lumo-max' : 'lumo-lite';
};
