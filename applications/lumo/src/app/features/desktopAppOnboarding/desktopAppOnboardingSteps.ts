import type { NativeNotificationPermission } from '@proton/lumo-api-client/core/desktop-notifications';

import type { DesktopAppOnboardingFinalStep, DesktopAppOnboardingStepName } from '../../util/telemetry';

export type DesktopAppOnboardingStep = DesktopAppOnboardingStepName;

/** Last step: free users get the Lumo Plus upsell; everyone else is asked to connect a first app. */
export type DesktopAppOnboardingFinal = DesktopAppOnboardingFinalStep;

/**
 * The notifications step is skipped when the desktop app can't ask (an older build without the
 * notifications bridge), when permission hasn't loaded, and when it's already granted.
 */
export const needsNotificationStep = ({
    hasNotificationsApi,
    permission,
}: {
    hasNotificationsApi: boolean;
    permission: NativeNotificationPermission | undefined;
}): boolean => {
    return hasNotificationsApi && permission !== undefined && permission !== 'granted';
};

export const getDesktopAppOnboardingSteps = ({
    includeNotifications,
}: {
    includeNotifications: boolean;
}): DesktopAppOnboardingStep[] => {
    const steps: DesktopAppOnboardingStep[] = ['welcome', 'connectors', 'skills', 'schedules'];
    if (includeNotifications) {
        steps.push('notifications');
    }
    steps.push('final');
    return steps;
};
