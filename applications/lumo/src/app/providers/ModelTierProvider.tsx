import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

export type ModelTier = 'auto' | 'fast' | 'thinking';

interface ModelTierContextType {
    modelTier: ModelTier;
    setModelTier: (mode: ModelTier) => void;
    isThinkingEnabled: boolean;
}

const ModelTierContext = createContext<ModelTierContextType | undefined>(undefined);

interface ModelTierProviderProps {
    children: ReactNode;
}

export const ModelTierProvider = ({ children }: ModelTierProviderProps) => {
    const [modelTier, setModelTierState] = useState<ModelTier>('auto');

    const setModelTier = useCallback((mode: ModelTier) => {
        setModelTierState(mode);
    }, []);

    const value: ModelTierContextType = {
        modelTier: modelTier,
        setModelTier: setModelTier,
        isThinkingEnabled: modelTier === 'thinking',
    };

    return <ModelTierContext.Provider value={value}>{children}</ModelTierContext.Provider>;
};

export const useModelTier = (): ModelTierContextType => {
    const context = useContext(ModelTierContext);
    if (context === undefined) {
        throw new Error('useModelTier must be used within a ModelTierProvider');
    }
    return context;
};
