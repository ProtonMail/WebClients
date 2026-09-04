import { useMemo, useState } from 'react';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';

import type { PrefetchResource } from '../../hooks/utils/usePrefetchResources';
import { usePrefetchResources } from '../../hooks/utils/usePrefetchResources';
import { isUnreadNotification } from '../../lib/notifications/notifications.utils';
import type { Callback } from '../../types';
import { InAppNotificationState } from '../../types';
import { pipe } from '../../utils/fp/pipe';
import { useOnline } from '../Core/ConnectivityProvider';
import { usePassThemeMode } from '../Layout/Theme/ThemeProvider';
import { useOnboarding } from '../Onboarding/OnboardingProvider';
import { InAppNotificationPromoModal } from './InAppNotificationPromoModal';
import { WithInAppNotification } from './WithInAppNotification';

export const InAppNotificationPromoButton = WithInAppNotification(
    ({ setNotificationState, notification, onAction }) => {
        const theme = usePassThemeMode();
        const { viewportWidth } = useActiveBreakpoint();
        const onboardingPrompt = useOnboarding().isActive;
        const online = useOnline();

        const { promoContents } = notification;
        const { backgroundImageUrl, contentImageUrl } = promoContents?.[theme] ?? {};

        const [showModal, setShowModal] = useState(() => {
            if (onboardingPrompt) return false;
            const unread = isUnreadNotification(notification);
            return !promoContents?.startMinimized && unread;
        });

        const withClose = <T extends Callback>(fn: T) => pipe(fn, () => setShowModal(false));

        usePrefetchResources(
            useMemo((): PrefetchResource[] => {
                const preload: PrefetchResource[] = [];
                if (backgroundImageUrl) preload.push({ url: backgroundImageUrl, as: 'image' });
                if (contentImageUrl) preload.push({ url: contentImageUrl, as: 'image' });
                return preload;
            }, [backgroundImageUrl, contentImageUrl])
        );

        return (
            promoContents && (
                <>
                    <PromotionButton
                        className="button-pill items-center flex-nowrap shrink-0"
                        color="norm"
                        disabled={!online}
                        icon={viewportWidth['<=medium']}
                        iconGradient
                        iconComponent={IcUpgrade}
                        iconSize={3.5}
                        onClick={() => setShowModal(true)}
                        style={{
                            '--upgrade-color-stop-1': '#9834ff',
                            '--upgrade-color-stop-2': '#F6CC88',
                        }}
                    >
                        <span className="hidden md:inline">{notification.promoContents?.minimizedPromoText}</span>
                    </PromotionButton>
                    {showModal && (
                        <InAppNotificationPromoModal
                            disabled={!online}
                            notification={notification}
                            theme={theme}
                            onAction={withClose(() => onAction(InAppNotificationState.DISMISSED))}
                            onClose={withClose(() => setNotificationState(InAppNotificationState.READ))}
                            onDismiss={withClose(() => setNotificationState(InAppNotificationState.DISMISSED))}
                        />
                    )}
                </>
            )
        );
    }
);
