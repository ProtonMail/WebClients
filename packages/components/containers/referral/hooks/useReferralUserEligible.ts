import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

export const getIsReferralUserEligible = (
    userSettings: UserSettings | undefined,
    isFree: boolean,
    app: APP_NAMES | undefined,
    appName: APP_NAMES
) =>
    !!userSettings?.Referral?.Eligible &&
    !(isFree && (app === APPS.PROTONVPN_SETTINGS || appName === APPS.PROTONVPN_SETTINGS));

export const useReferralUserEligible = () => {
    const location = useLocation();
    const [userSettings] = useUserSettings();
    const [user] = useUser();
    const { isFree } = user;
    const { APP_NAME } = useConfig();

    const app = getAppFromPathnameSafe(location.pathname);

    const isUserEligible = getIsReferralUserEligible(userSettings, isFree, app, APP_NAME);

    return { isUserEligible };
};
