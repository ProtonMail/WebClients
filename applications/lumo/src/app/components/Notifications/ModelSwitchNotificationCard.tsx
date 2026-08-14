import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import {
    isModelSwitchSuggestionEligible,
    shouldShowModelSwitchSuggestion,
    shouldShowWeeklyLimitUpsell,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { ConversationId, Message } from '../../types';
import {
    hasDismissedModelSwitchNotification,
    markModelSwitchNotificationDismissed,
} from '../../util/modelSwitchNotificationStorage';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ComposerNotificationCard } from './ComposerNotificationCard';

import './ModelSwitchNotificationCard.scss';

interface ModelSwitchNotificationCardProps {
    messageChain: Message[];
    conversationId?: ConversationId;
    isGenerating?: boolean;
}

export const ModelSwitchNotificationCard = ({
    messageChain,
    conversationId,
    isGenerating = false,
}: ModelSwitchNotificationCardProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isGuest = useIsGuest();
    const { modelTier, setModelTier } = useModelTier();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { hasTierErrors } = useTierErrors();
    const remainingLimits = useRemainingLimits();
    const weeklyLimitUpsellVisible = shouldShowWeeklyLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);
    const [dismissed, setDismissed] = useState(false);
    const [dismissedAtMessageCount, setDismissedAtMessageCount] = useState(-1);

    useEffect(() => {
        if (isGuest && conversationId) {
            setDismissed(hasDismissedModelSwitchNotification(conversationId));
            return;
        }

        setDismissed(false);
        setDismissedAtMessageCount(-1);
    }, [conversationId, isGuest]);

    const selectedModelTier = getSelectedModelTier(modelTier);

    const suggestionArgs = {
        hasLumoPlus,
        selectedModelTier,
        remainingLimits,
        weeklyLimitUpsellVisible,
        messageCount: messageChain.length,
        isMaxAvailableByFlag,
    };
    const isEligible = isModelSwitchSuggestionEligible(suggestionArgs);
    const shouldShow = shouldShowModelSwitchSuggestion({ ...suggestionArgs, isGenerating });

    const isVisible =
        shouldShow &&
        (isGuest
            ? !dismissed
            : !dismissed || (messageChain.length > dismissedAtMessageCount && messageChain.length % 2 === 0));

    const persistGuestDismissal = useCallback(() => {
        setDismissed(true);

        if (conversationId) {
            markModelSwitchNotificationDismissed(conversationId);
        }
    }, [conversationId]);

    const handleDismiss = useCallback(() => {
        if (isGuest) {
            persistGuestDismissal();
            return;
        }

        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [isGuest, messageChain.length, persistGuestDismissal]);

    const handleSwitchToMax = useCallback(() => {
        setModelTier('lumo-max');

        if (isGuest) {
            persistGuestDismissal();
            return;
        }

        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [isGuest, messageChain.length, persistGuestDismissal, setModelTier]);

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
