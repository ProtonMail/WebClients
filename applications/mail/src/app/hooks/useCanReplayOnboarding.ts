import { differenceInMonths, fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import useFlag from '@proton/unleash/useFlag';

import useMailOnboardingVariant from 'proton-mail/components/onboarding/useMailOnboardingVariant';

export const useCanReplayOnboarding = () => {
    const [user] = useUser();
    const mailOnboarding = useMailOnboardingVariant();
    const isMailOnboardingEnabled = mailOnboarding.isEnabled && mailOnboarding.variant !== 'none';
    const isOnboardingReplayEnabled = useFlag('ReplayOnboardingModal');
    const { isElectron: isDesktopApp } = useIsInboxElectronApp();

    const now = new Date();
    const monthsSinceAccountCreation = differenceInMonths(now, fromUnixTime(user.CreateTime));

    return isMailOnboardingEnabled && isOnboardingReplayEnabled && !isDesktopApp && monthsSinceAccountCreation <= 6;
};
