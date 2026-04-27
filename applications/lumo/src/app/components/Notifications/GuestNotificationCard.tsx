import { useCallback, useState } from 'react';

import { IcHeart } from '@proton/icons/icons/IcHeart';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { Message } from '../../types';
import { sendGuestNotificationCtaClickedEvent, sendGuestNotificationDismissedEvent } from '../../util/telemetry';
import { CreateFreeAccountButton } from '../Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { ComposerNotificationCard } from './ComposerNotificationCard';

import './GuestNotificationCard.scss';
import { c } from 'ttag';

const HeartIcon = () => {
    return (
        <div className="guest-notification-heart-icon inline-flex items-center justify-center shrink-0 rounded-full">
            <IcHeart size={5} color="#7F77DD" />
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
    const [dismissed, setDismissed] = useState(false);
    const [dismissedAtMessageCount, setDismissedAtMessageCount] = useState(-1);

    // Require at least one complete exchange (user + assistant) before showing
    // the CTA. This avoids a flash on fresh chats where `isGenerating` briefly
    // reads `false` before the user's first message is submitted.
    const hasCompletedExchange = messageChain.length >= 2;

    const shouldShow =
        hasCompletedExchange &&
        !isGenerating &&
        (!dismissed || (dismissed && messageChain.length > dismissedAtMessageCount && messageChain.length % 2 === 0));

    const handleDismiss = useCallback(() => {
        sendGuestNotificationDismissedEvent(messageChain.length);
        setDismissed(true);
        setDismissedAtMessageCount(messageChain.length);
    }, [messageChain.length]);

    if (isSmallScreen) {
        return null;
    }

    return (
        <ComposerNotificationCard
            icon={<HeartIcon />}
            title="Liking Lumo?"
            description={c('collider_2025: Notification').t`Create an account or sign in to save your chats and increase limits.`}
            action={
                <CreateFreeAccountButton onClick={() => sendGuestNotificationCtaClickedEvent(messageChain.length)} />
            }
            dismissible
            onDismiss={handleDismiss}
            hidden={!shouldShow}
        />
    );
};
