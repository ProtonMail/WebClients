import { type ReactNode, useCallback, useRef, useState } from 'react';

import { useLumoUserSettings } from '../hooks/useLumoUserSettings';
import { useIsGuest } from './IsGuestProvider';
import { ModelTierLimitsSync } from './ModelTierLimitsSync';
import { ModelTierPreferencesSync } from './ModelTierPreferencesSync';
import {
    DEFAULT_MODEL_TIER,
    DEFAULT_RESPONSE_MODE,
    type ModelTier,
    type ResponseMode,
    getSelectedModelTier,
} from './modelTierConstants';
import { ModelTierContext, type ModelTierContextType } from './modelTierContext';

export type { ModelTier, ResponseMode } from './modelTierConstants';
export { DEFAULT_MODEL_TIER, DEFAULT_RESPONSE_MODE, getSelectedModelTier } from './modelTierConstants';
export { useModelTier, useOptionalModelTier } from './modelTierContext';
export type { ModelTierContextType } from './modelTierContext';

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
