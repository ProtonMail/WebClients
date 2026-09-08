import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import {
    isModelSwitchSuggestionEligible,
    shouldShowLimitUpsell,
    shouldShowModelSwitchSuggestion,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { Message } from '../../types';
import {
    hasDismissedModelSwitchNotification,
    markModelSwitchNotificationDismissed,
} from '../../util/modelSwitchNotificationStorage';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ComposerNotificationCard } from './ComposerNotificationCard';

import './ModelSwitchNotificationCard.scss';

interface ModelSwitchNotificationCardProps {
    messageChain: Message[];
    isGenerating?: boolean;
}

export const ModelSwitchNotificationCard = ({
    messageChain,
    isGenerating = false,
}: ModelSwitchNotificationCardProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { modelTier, setModelTier } = useModelTier();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { hasTierErrors } = useTierErrors();
    const remainingLimits = useRemainingLimits();
    const limitUpsellVisible = shouldShowLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);
    const [dismissed, setDismissed] = useState(hasDismissedModelSwitchNotification);

    const selectedModelTier = getSelectedModelTier(modelTier);
    const selectedModelLabel = selectedModelTier === 'apertus-15' ? 'Apertus 1.5 🇨🇭' : `${LUMO_SHORT_APP_NAME} Lite`;

    const suggestionArgs = {
        hasLumoPlus,
        selectedModelTier,
        remainingLimits,
        limitUpsellVisible,
        messageCount: messageChain.length,
        isMaxAvailableByFlag,
    };
    const isEligible = isModelSwitchSuggestionEligible(suggestionArgs);
    const shouldShow = shouldShowModelSwitchSuggestion({ ...suggestionArgs, isGenerating });

    const isVisible = shouldShow && !dismissed;

    const persistDismissal = useCallback(() => {
        setDismissed(true);
        markModelSwitchNotificationDismissed();
    }, []);

    const handleSwitchToMax = useCallback(() => {
        setModelTier('lumo-max');
        persistDismissal();
    }, [persistDismissal, setModelTier]);

    // Stay mounted while eligible so dismiss state survives isGenerating toggles.
    if (isSmallScreen || !isEligible) {
        return null;
    }

    return (
        <ComposerNotificationCard
            icon={
                <div className="model-switch-notification-icon inline-flex items-center justify-center shrink-0 rounded-full">
                    <LumoIcon name="Gem" size={16} className="color-primary" />
                </div>
            }
            title={c('collider_2025: Notification')
                .t`You're on ${selectedModelLabel}. Switch to Max for more capable answers.`}
            action={{
                label: c('collider_2025: Action').t`Switch to Max`,
                onClick: handleSwitchToMax,
                color: 'norm',
                shape: 'outline',
            }}
            dismissible
            onDismiss={persistDismissal}
            hidden={!isVisible}
        />
    );
};
