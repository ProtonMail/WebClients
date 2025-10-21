import { useEffect, useMemo, useRef, useState } from 'react';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassThemeMode } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { InAppNotificationPromoModal } from '@proton/pass/components/Notifications/InAppNotificationPromoModal';
import { WithInAppNotification } from '@proton/pass/components/Notifications/WithInAppNotification';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import type { PrefetchResource } from '@proton/pass/hooks/utils/usePrefetchResources';
import { usePrefetchResources } from '@proton/pass/hooks/utils/usePrefetchResources';
import { isUnreadNotification } from '@proton/pass/lib/notifications/notifications.utils';
import type { Callback } from '@proton/pass/types';
import { InAppNotificationState } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';

export const InAppNotificationPromoButton = WithInAppNotification(
    ({ setNotificationState, notification, onAction }) => {
        const theme = usePassThemeMode();
        const { viewportWidth } = useActiveBreakpoint();
        const onboardingPrompt = useOnboarding().isActive;
        const online = useConnectivity();

        const { promoContents } = notification;
        const { backgroundImageUrl, contentImageUrl } = promoContents?.[theme] ?? {};

        const [showModal, setShowModal] = useState(false);
        const [loading, setLoading] = useState(false);

        const withClose = <T extends Callback>(fn: T) => pipe(fn, () => setShowModal(false));

        const resources = useMemo((): PrefetchResource[] => {
            const preload: PrefetchResource[] = [];
            if (backgroundImageUrl) preload.push({ url: backgroundImageUrl, as: 'image' });
            if (contentImageUrl) preload.push({ url: contentImageUrl, as: 'image' });
            return preload;
        }, [backgroundImageUrl, contentImageUrl]);

        const resourcesLoading = useStatefulRef(usePrefetchResources(resources));
        const openRequest = useRef(0);

        const openModal = safeAsyncCall(async (userInitiated: boolean) => {
            if (resourcesLoading.current) {
                if (userInitiated) setLoading(true);

                const current = openRequest.current + 1;
                const check = () => !resourcesLoading.current;
                const cancel = () => openRequest.current !== current;

                openRequest.current = current;
                await waitUntil({ check, cancel }, 250);
            }

            if (userInitiated) setLoading(false);
            setShowModal(true);
        });

        useEffect(() => {
            const shouldPrompt = (() => {
                if (onboardingPrompt) return false;
                const unread = isUnreadNotification(notification);
                return !promoContents?.startMinimized && unread;
            })();

            if (shouldPrompt) void openModal(false);

            return () => {
                /** Cancels any ongoing async request */
                openRequest.current += 1;
            };
        }, []);

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
                        onClick={() => openModal(true)}
                        loading={loading}
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
