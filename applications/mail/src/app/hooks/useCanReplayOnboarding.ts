import { differenceInMonths, fromUnixTime } from 'date-fns';

import { useUser } from '@proton/account/user/hooks';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';

export const useCanReplayOnboarding = () => {
    const [user] = useUser();
    const { isElectron: isDesktopApp } = useIsInboxElectronApp();

    const now = new Date();
    const monthsSinceAccountCreation = differenceInMonths(now, fromUnixTime(user.CreateTime));

    return !isDesktopApp && monthsSinceAccountCreation <= 6;
};
