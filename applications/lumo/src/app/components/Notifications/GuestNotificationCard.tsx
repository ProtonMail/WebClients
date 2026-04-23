import { useCallback, useState } from 'react';

import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcHeart } from '@proton/icons/icons/IcHeart';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { Message } from '../../types';
import { CreateFreeAccountButton } from '../Guest/CreateFreeAccountLink/CreateFreeAccountLink';

import './GuestNotificationCard.scss';

const HeartIcon = ({ size = 32, heartColor = '#7F77DD', bgColor = '#EEEDFE' }) => {
    return (
        <div
            // className={className}
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

    const shouldShow =
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
        <div
            className={clsx(
                'guest-notification-card',
                'flex flex-row flex-nowrap items-center gap-1 border border-weak rounded-xl p-4 justify-space-between mb-4 relative group-hover-opacity-container',
                {
                    hidden: !shouldShow,
                }
            )}
        >
            <div className="flex flex-row flex-nowrap items-center gap-2">
                <HeartIcon />
                <div className="flex flex-column gap-1">
                    <span className="text-semibold">Liking Lumo?</span>
                    <span className="text-sm">
                        Create an account or sign in to save your chats and increase limits.
                    </span>
                </div>
            </div>
            <CreateFreeAccountButton />
            <Button
                icon
                shape="ghost"
                size="small"
                className="guest-notification-card-dismiss-button rounded-full border-weak shrink-0 self-start absolute top-0 right-0 bg-norm group-hover:opacity-100"
                onClick={handleDismiss}
            >
                <IcCross size={3} color="danger" />
            </Button>
        </div>
    );
};
