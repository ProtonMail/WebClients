import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useChatLimitGate } from '../../hooks/useChatLimitGate';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { useTierErrors } from '../../hooks/useTierErrors';
import { getSelectedModelTier, useOptionalModelTier } from '../../providers/ModelTierProvider';
import {
    shouldShowModelSwitchSuggestion,
    shouldShowWeeklyLimitUpsell,
    useRemainingLimits,
} from '../../services/usageLimitsStore';
import type { Message } from '../../types';
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
    isGenerating?: boolean;
}

// Only shown for medium and larger screens
export const GuestNotificationCard = ({ messageChain, isGenerating = false }: GuestNotificationCardProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { isBlocked: isChatLimitBlocked } = useChatLimitGate();
    const { hasTierErrors } = useTierErrors();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const remainingLimits = useRemainingLimits();
    const weeklyLimitUpsellVisible = shouldShowWeeklyLimitUpsell(remainingLimits, hasTierErrors, hasLumoPlus);
    const modelTierContext = useOptionalModelTier();
    const selectedModelTier = modelTierContext ? getSelectedModelTier(modelTierContext.modelTier) : undefined;
    const modelSwitchSuggestionVisible =
        selectedModelTier !== undefined &&
        shouldShowModelSwitchSuggestion({
            hasLumoPlus,
            selectedModelTier,
            remainingLimits,
            weeklyLimitUpsellVisible,
            messageCount: messageChain.length,
            isGenerating,
            isMaxAvailableByFlag,
        });
    const [dismissed, setDismissed] = useState(false);
    const [dismissedAtMessageCount, setDismissedAtMessageCount] = useState(-1);

    // Require at least one complete exchange (user + assistant) before showing
    // the CTA. This avoids a flash on fresh chats where `isGenerating` briefly
    // reads `false` before the user's first message is submitted.
    const hasCompletedExchange = messageChain.length >= 2;

    const shouldShow =
        !weeklyLimitUpsellVisible &&
        !modelSwitchSuggestionVisible &&
        !isChatLimitBlocked &&
        hasCompletedExchange &&
        !isGenerating &&
        (!dismissed || (dismissed && messageChain.length > dismissedAtMessageCount && messageChain.length % 2 === 0));

    const handleDismiss = useCallback(() => {
        sendGuestNotificationDismissedEvent(messageChain.length);
        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [messageChain.length]);

    if (isSmallScreen || !shouldShow) {
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
            hidden={!shouldShow}
        />
    );
};
