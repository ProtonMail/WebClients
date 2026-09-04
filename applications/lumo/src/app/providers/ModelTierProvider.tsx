import { type ReactNode, useCallback, useRef, useState } from 'react';

import ApertusOnboardingModal from '../components/Modals/ApertusOnboardingModal';
import { useLumoUserSettings } from '../hooks/useLumoUserSettings';
import { markApertusAnnouncementDismissed } from '../util/apertusAnnouncementStorage';
import {
    getApertusOnboardingAcceptedAt,
    markApertusOnboardingAccepted,
} from '../util/apertusOnboardingStorage';
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
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const skipPersistRef = useRef(false);
    const [modelTier, setModelTierState] = useState<ModelTier>(DEFAULT_MODEL_TIER);
    const [responseMode, setResponseModeState] = useState<ResponseMode>(DEFAULT_RESPONSE_MODE);
    const [localApertusAcceptedAt, setLocalApertusAcceptedAt] = useState(getApertusOnboardingAcceptedAt);
    const [isApertusOnboardingOpen, setIsApertusOnboardingOpen] = useState(false);
    const hasAcceptedApertus = Boolean(
        localApertusAcceptedAt || lumoUserSettings.apertusOnboardingAcceptedAt
    );

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
            if (mode === 'apertus-15' && !hasAcceptedApertus) {
                setIsApertusOnboardingOpen(true);
                return false;
            }

            setModelTierState(mode);

            if (!isGuest && !skipPersistRef.current) {
                updateSettings({
                    preferredModelTier: getSelectedModelTier(mode),
                    _autoSave: true,
                });
            }

            return true;
        },
        [hasAcceptedApertus, isGuest, updateSettings]
    );

    const confirmApertusOnboarding = useCallback(() => {
        const acceptedAt = Date.now();
        markApertusOnboardingAccepted(acceptedAt);
        markApertusAnnouncementDismissed();
        setLocalApertusAcceptedAt(acceptedAt);
        setModelTierState('apertus-15');
        setIsApertusOnboardingOpen(false);

        if (!isGuest) {
            updateSettings({
                apertusOnboardingAcceptedAt: acceptedAt,
                preferredModelTier: 'apertus-15',
                _autoSave: true,
            });
        }
    }, [isGuest, updateSettings]);

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
            <ApertusOnboardingModal
                open={isApertusOnboardingOpen}
                onClose={() => setIsApertusOnboardingOpen(false)}
                onConfirm={confirmApertusOnboarding}
            />
            {children}
        </ModelTierContext.Provider>
    );
};
