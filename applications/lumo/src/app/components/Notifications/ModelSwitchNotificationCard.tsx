import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import {
    isModelSwitchSuggestionEligible,
    shouldShowLimitUpsell,
    shouldShowModelSwitchSuggestion,
    useExhaustedLimitNotice,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { Message } from '../../types';
import { getModelDisplayName } from '../../util/modelTierDisplay';
import {
    type SuggestedModel,
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
    const exhaustedLimitNotice = useExhaustedLimitNotice();
    const [dismissedModels, setDismissedModels] = useState<Set<SuggestedModel>>(
        () =>
            new Set(
                (['lumo-lite', 'apertus-15'] as SuggestedModel[]).filter(hasDismissedModelSwitchNotification)
            )
    );

    const selectedModelTier = getSelectedModelTier(modelTier);
    const suggestedModel: SuggestedModel =
        selectedModelTier === 'apertus-15' ? 'apertus-15' : 'lumo-lite';
    const limitUpsellVisible =
        exhaustedLimitNotice !== null &&
        shouldShowLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus, exhaustedLimitNotice.modelTier);
    const selectedModelLabel = getModelDisplayName(selectedModelTier, { withFlag: true, liteLabel: 'short' });

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

    const isVisible = shouldShow && !dismissedModels.has(suggestedModel);

    const persistDismissal = useCallback(() => {
        setDismissedModels((current) => new Set(current).add(suggestedModel));
        markModelSwitchNotificationDismissed(suggestedModel);
    }, [suggestedModel]);

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
