import { type ReactNode, useCallback, useRef, useState } from 'react';

import ApertusOnboardingModal from '../components/Modals/ApertusOnboardingModal';
import { useLumoFlags } from '../hooks/useLumoFlags';
import { useLumoUserSettings } from '../hooks/useLumoUserSettings';
import { useMaxModelAvailability } from '../hooks/useMaxModelAvailability';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { saveConversationModelTier } from '../redux/slices/core/conversations';
import { resolveAvailableModelTier, useRemainingLimits } from '../services/usageLimitsStore';
import type { ConversationId } from '../types';
import { markApertusAnnouncementDismissed } from '../util/apertusAnnouncementStorage';
import { getApertusOnboardingAcceptedAt, markApertusOnboardingAccepted } from '../util/apertusOnboardingStorage';
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
export { getSelectedModelTier } from './modelTierConstants';
export { useModelTier, useOptionalModelTier } from './modelTierContext';

interface ModelTierProviderProps {
    children: ReactNode;
    conversationId?: ConversationId;
}

export const ModelTierProvider = ({ children, conversationId }: ModelTierProviderProps) => {
    const isGuest = useIsGuest();
    const dispatch = useLumoDispatch();
    const conversation = useLumoSelector((state) => {
        return conversationId === undefined ? undefined : state.conversations[conversationId];
    });
    const remainingLimits = useRemainingLimits();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { apertusModelAvailable, previewModelAvailable } = useLumoFlags();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const skipPersistRef = useRef(false);
    const [modelTier, setModelTierState] = useState<ModelTier>(DEFAULT_MODEL_TIER);
    const [responseMode, setResponseModeState] = useState<ResponseMode>(DEFAULT_RESPONSE_MODE);
    const [localApertusAcceptedAt, setLocalApertusAcceptedAt] = useState(getApertusOnboardingAcceptedAt);
    const [isApertusOnboardingOpen, setIsApertusOnboardingOpen] = useState(false);
    const hasAcceptedApertus = Boolean(localApertusAcceptedAt || lumoUserSettings.apertusOnboardingAcceptedAt);

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

    const persistModelTier = useCallback(
        (mode: ModelTier) => {
            if (conversation) {
                dispatch(saveConversationModelTier({ id: conversation.id, modelTier: getSelectedModelTier(mode) }));
            }
            setModelTierState(mode);
            if (!isGuest && !skipPersistRef.current) {
                updateSettings({ preferredModelTier: getSelectedModelTier(mode), _autoSave: true });
            }
        },
        [conversation, dispatch, isGuest, updateSettings]
    );

    const setModelTier = useCallback(
        (mode: ModelTier) => {
            if (mode === 'apertus-15' && !hasAcceptedApertus) {
                setIsApertusOnboardingOpen(true);
                return false;
            }

            persistModelTier(mode);
            return true;
        },
        [hasAcceptedApertus, persistModelTier]
    );

    const confirmApertusOnboarding = useCallback(() => {
        const acceptedAt = Date.now();
        markApertusOnboardingAccepted(acceptedAt);
        markApertusAnnouncementDismissed();
        setLocalApertusAcceptedAt(acceptedAt);
        persistModelTier('apertus-15');
        setIsApertusOnboardingOpen(false);

        if (!isGuest) {
            updateSettings({
                apertusOnboardingAcceptedAt: acceptedAt,
                _autoSave: true,
            });
        }
    }, [isGuest, persistModelTier, updateSettings]);

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

    const conversationModelTier = conversation?.modelTier;
    // An explicit Lite choice should hit its quota gate rather than silently switch back to Max.
    const effectiveModelTier =
        conversationModelTier === undefined
            ? modelTier
            : conversationModelTier === 'lumo-lite'
              ? 'lumo-lite'
              : resolveAvailableModelTier(conversationModelTier, remainingLimits, {
                    isMaxAvailable: isMaxAvailableByFlag,
                    isApertusEnabled: apertusModelAvailable,
                    isPreviewEnabled: previewModelAvailable,
                });

    const value: ModelTierContextType = {
        modelTier: effectiveModelTier,
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
            {conversationModelTier === undefined && <ModelTierLimitsSync />}
            <ApertusOnboardingModal
                open={isApertusOnboardingOpen}
                onClose={() => setIsApertusOnboardingOpen(false)}
                onConfirm={confirmApertusOnboarding}
            />
            {children}
        </ModelTierContext.Provider>
    );
};
