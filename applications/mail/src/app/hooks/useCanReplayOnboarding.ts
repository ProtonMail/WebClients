import { differenceInMonths, fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import useFlag from '@proton/unleash/useFlag';

export const useCanReplayOnboarding = () => {
    const [user] = useUser();
    const isOnboardingReplayEnabled = useFlag('ReplayOnboardingModal');
    const { isElectron: isDesktopApp } = useIsInboxElectronApp();

    const now = new Date();
    const monthsSinceAccountCreation = differenceInMonths(now, fromUnixTime(user.CreateTime));

    return isOnboardingReplayEnabled && !isDesktopApp && monthsSinceAccountCreation <= 6;
};
