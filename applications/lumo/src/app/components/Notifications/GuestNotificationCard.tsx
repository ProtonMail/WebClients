import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useChatLimitGate } from '../../hooks/useChatLimitGate';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useOptionalModelTier } from '../../providers/ModelTierProvider';
import {
    isModelSwitchSuggestionEligible,
    shouldShowWeeklyLimitUpsell,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { ConversationId, Message } from '../../types';
import {
    hasDismissedGuestNotification,
    markGuestNotificationDismissed,
} from '../../util/guestNotificationStorage';
import { sendGuestNotificationCtaClickedEvent, sendGuestNotificationDismissedEvent } from '../../util/telemetry';
import { CreateFreeAccountButton } from '../Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ComposerNotificationCard } from './ComposerNotificationCard';

import './GuestNotificationCard.scss';

const HeartIcon = () => {
    return (
        <div className="guest-notification-heart-icon inline-flex items-center justify-center shrink-0 rounded-full">
            <LumoIcon name="Heart" size={20} color="#7F77DD" />
        </div>
    );
};

interface GuestNotificationCardProps {
    messageChain: Message[];
    conversationId?: ConversationId;
    isGenerating?: boolean;
}

// Only shown for medium and larger screens
export const GuestNotificationCard = ({
    messageChain,
    conversationId,
    isGenerating = false,
}: GuestNotificationCardProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { isBlocked: isChatLimitBlocked } = useChatLimitGate();
    const { hasTierErrors } = useTierErrors();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const remainingLimits = useRemainingLimits();
    const weeklyLimitUpsellVisible = shouldShowWeeklyLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);
    const modelTierContext = useOptionalModelTier();
    const selectedModelTier = modelTierContext ? getSelectedModelTier(modelTierContext.modelTier) : undefined;
    const modelSwitchSuggestionEligible =
        selectedModelTier !== undefined &&
        isModelSwitchSuggestionEligible({
            hasLumoPlus,
            selectedModelTier,
            remainingLimits,
            weeklyLimitUpsellVisible,
            messageCount: messageChain.length,
            isMaxAvailableByFlag,
        });
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (conversationId) {
            setDismissed(hasDismissedGuestNotification(conversationId));
            return;
        }

        setDismissed(false);
    }, [conversationId]);

    // Require at least one complete exchange (user + assistant) before showing
    // the CTA. This avoids a flash on fresh chats where `isGenerating` briefly
    // reads `false` before the user's first message is submitted.
    const hasCompletedExchange = messageChain.length >= 2;

    const canEverShow =
        !weeklyLimitUpsellVisible &&
        !modelSwitchSuggestionEligible &&
        !isChatLimitBlocked &&
        hasCompletedExchange &&
        !dismissed;

    const isVisible = canEverShow && !isGenerating;

    const handleDismiss = useCallback(() => {
        sendGuestNotificationDismissedEvent(messageChain.length);
        setDismissed(true);

        if (conversationId) {
            markGuestNotificationDismissed(conversationId);
        }
    }, [conversationId, messageChain.length]);

    // Stay mounted while eligible so dismiss state survives isGenerating toggles.
    if (isSmallScreen || !canEverShow) {
        return null;
    }

    return (
        <ComposerNotificationCard
            icon={<HeartIcon />}
            title="Liking Lumo?"
            description={c('collider_2025: Notification')
                .t`Create an account or sign in to save your chats and increase limits.`}
            action={
                <CreateFreeAccountButton onClick={() => sendGuestNotificationCtaClickedEvent(messageChain.length)} />
            }
            dismissible
            onDismiss={handleDismiss}
            hidden={!isVisible}
        />
    );
};
