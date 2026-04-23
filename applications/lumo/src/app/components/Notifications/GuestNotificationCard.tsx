import { useCallback, useState } from 'react';

import { IcHeart } from '@proton/icons/icons/IcHeart';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { Message } from '../../types';
import { CreateFreeAccountButton } from '../Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { ComposerNotificationCard } from './ComposerNotificationCard';

const HeartIcon = ({ size = 32, heartColor = '#7F77DD', bgColor = '#EEEDFE' }) => {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: bgColor,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <IcHeart size={5} color={heartColor} />
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
            description="Create an account or sign in to save your chats and increase limits."
            action={<CreateFreeAccountButton />}
            dismissible
            onDismiss={handleDismiss}
            hidden={!shouldShow}
        />
    );
};
