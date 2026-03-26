import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

export const getIsReferralUserEligible = (
    userSettings: UserSettings | undefined,
    isFree: boolean,
    app: APP_NAMES | undefined
) => !!userSettings?.Referral?.Eligible && !(isFree && app === APPS.PROTONVPN_SETTINGS);

export const useReferralUserEligible = () => {
    const location = useLocation();
    const [userSettings] = useUserSettings();
    const [user] = useUser();
    const { isFree } = user;

    const app = getAppFromPathnameSafe(location.pathname);

    const isUserEligible = getIsReferralUserEligible(userSettings, isFree, app);

    return { isUserEligible };
};
