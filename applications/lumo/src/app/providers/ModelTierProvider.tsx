import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';

import { useLumoUserSettings } from '../hooks/useLumoUserSettings';
import { useIsGuest } from './IsGuestProvider';
import { ModelTierLimitsSync } from './ModelTierLimitsSync';
import { ModelTierPreferencesSync } from './ModelTierPreferencesSync';

export type ModelTier = 'auto' | 'lumo-lite' | 'lumo-max';
export type ResponseMode = 'fast' | 'thinking';

export const DEFAULT_MODEL_TIER: ModelTier = 'lumo-max';
export const DEFAULT_RESPONSE_MODE: ResponseMode = 'thinking';

interface ModelTierContextType {
    modelTier: ModelTier;
    setModelTier: (mode: ModelTier) => void;
    setModelTierWithoutPersist: (mode: ModelTier) => void;
    responseMode: ResponseMode;
    setResponseMode: (mode: ResponseMode) => void;
    setResponseModeWithoutPersist: (mode: ResponseMode) => void;
    isThinkingEnabled: boolean;
}

const ModelTierContext = createContext<ModelTierContextType | undefined>(undefined);

interface ModelTierProviderProps {
    children: ReactNode;
}

export const ModelTierProvider = ({ children }: ModelTierProviderProps) => {
    const isGuest = useIsGuest();
    const { updateSettings } = useLumoUserSettings();
    const skipPersistRef = useRef(false);
    const [modelTier, setModelTierState] = useState<ModelTier>(DEFAULT_MODEL_TIER);
    const [responseMode, setResponseModeState] = useState<ResponseMode>(DEFAULT_RESPONSE_MODE);

    const setModelTierWithoutPersist = useCallback((mode: ModelTier) => {
        skipPersistRef.current = true;
        setModelTierState(mode);
        skipPersistRef.current = false;
    }, []);

    const setResponseModeWithoutPersist = useCallback((mode: ResponseMode) => {
        skipPersistRef.current = true;
        setResponseModeState(mode);
        skipPersistRef.current = false;
    }, []);

    const setModelTier = useCallback(
        (mode: ModelTier) => {
            setModelTierState(mode);

            if (!isGuest && !skipPersistRef.current) {
                updateSettings({
                    preferredModelTier: getSelectedModelTier(mode),
                    _autoSave: true,
                });
            }
        },
        [isGuest, updateSettings]
    );

    const setResponseMode = useCallback(
        (mode: ResponseMode) => {
            setResponseModeState(mode);

            if (!isGuest && !skipPersistRef.current) {
                updateSettings({
                    preferredResponseMode: mode,
                    _autoSave: true,
                });
            }
        },
        [isGuest, updateSettings]
    );

    const value: ModelTierContextType = {
        modelTier: modelTier,
        setModelTier: setModelTier,
        setModelTierWithoutPersist: setModelTierWithoutPersist,
        responseMode: responseMode,
        setResponseMode: setResponseMode,
        setResponseModeWithoutPersist: setResponseModeWithoutPersist,
        isThinkingEnabled: responseMode === 'thinking',
    };

    return (
        <ModelTierContext.Provider value={value}>
            <ModelTierPreferencesSync />
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
