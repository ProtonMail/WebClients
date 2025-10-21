import { useMemo, useState } from 'react';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassThemeMode } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { InAppNotificationPromoModal } from '@proton/pass/components/Notifications/InAppNotificationPromoModal';
import { WithInAppNotification } from '@proton/pass/components/Notifications/WithInAppNotification';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import type { PreloadableResource } from '@proton/pass/hooks/utils/usePreloadResources';
import { usePreloadResources } from '@proton/pass/hooks/utils/usePreloadResources';
import { isUnreadNotification } from '@proton/pass/lib/notifications/notifications.utils';
import type { Callback } from '@proton/pass/types';
import { InAppNotificationState } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const InAppNotificationPromoButton = WithInAppNotification(
    ({ setNotificationState, notification, onAction }) => {
        const theme = usePassThemeMode();
        const { viewportWidth } = useActiveBreakpoint();
        const onboardingPrompt = useOnboarding().isActive;
        const online = useConnectivity();

        const { promoContents } = notification;
        const { backgroundImageUrl, contentImageUrl } = promoContents?.[theme] ?? {};

        const [showModal, setShowModal] = useState(() => {
            if (onboardingPrompt) return false;
            const unread = isUnreadNotification(notification);
            return !promoContents?.startMinimized && unread;
        });

        const withClose = <T extends Callback>(fn: T) => pipe(fn, () => setShowModal(false));

        const resources = useMemo((): PreloadableResource[] => {
            const preload: PreloadableResource[] = [];
            if (backgroundImageUrl) preload.push({ url: backgroundImageUrl, as: 'image' });
            if (contentImageUrl) preload.push({ url: contentImageUrl, as: 'image' });
            return preload;
        }, [backgroundImageUrl, contentImageUrl]);

        usePreloadResources(resources);

        return (
            promoContents && (
                <>
                    <PromotionButton
                        className="button-pill items-center flex-nowrap shrink-0"
                        color="norm"
                        disabled={!online}
                        icon={viewportWidth['<=medium']}
                        iconGradient
                        iconName="upgrade"
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
