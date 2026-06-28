import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import {
    shouldShowModelSwitchSuggestion,
    shouldShowWeeklyLimitUpsell,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { Message } from '../../types';
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
    const weeklyLimitUpsellVisible = shouldShowWeeklyLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);
    const [dismissed, setDismissed] = useState(false);
    const [dismissedAtMessageCount, setDismissedAtMessageCount] = useState(-1);

    const selectedModelTier = getSelectedModelTier(modelTier);

    const shouldShow = shouldShowModelSwitchSuggestion({
        hasLumoPlus,
        selectedModelTier,
        remainingLimits,
        weeklyLimitUpsellVisible,
        messageCount: messageChain.length,
        isGenerating,
        isMaxAvailableByFlag,
    });

    const isVisible =
        shouldShow &&
        (!dismissed || (dismissed && messageChain.length > dismissedAtMessageCount && messageChain.length % 2 === 0));

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [messageChain.length]);

    const handleSwitchToMax = useCallback(() => {
        setModelTier('lumo-max');
        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [messageChain.length, setModelTier]);

    if (isSmallScreen || !shouldShow) {
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
                .t`You're on ${LUMO_SHORT_APP_NAME} Lite. Switch to Max for more capable answers.`}
            action={{
                label: c('collider_2025: Action').t`Switch to Max`,
                onClick: handleSwitchToMax,
                color: 'norm',
                shape: 'outline',
            }}
            dismissible
            onDismiss={handleDismiss}
            hidden={!isVisible}
        />
    );
};
