import useUserSettings from '@proton/components/hooks/useUserSettings';
import { APPS, CALENDAR_MOBILE_APP_LINKS, MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/constants';
import { isAndroid as getIsAndroid, isIos as getIsIos } from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';

import type { SmartBannerApp } from './types';

const isUser = {
    [APPS.PROTONCALENDAR]: isCalendarMobileAppUser,
    [APPS.PROTONMAIL]: isMailMobileAppUser,
};

const storeLinks = {
    [APPS.PROTONCALENDAR]: CALENDAR_MOBILE_APP_LINKS,
    [APPS.PROTONMAIL]: MAIL_MOBILE_APP_LINKS,
};

export const useSmartBanner = (app: SmartBannerApp) => {
    // We can't (easily) detect if a user has downloaded/installed the native app, but
    // we can check if the user has ever used the app. If they have, don't render the banner.
    const [userSettings] = useUserSettings();

    const hasUsedNativeApp = isUser[app](BigInt(userSettings.UsedClientFlags));

    if (hasUsedNativeApp) {
        return null;
    }

    // The banner is only supported on iOS and Android devices.
    const isAndroid = getIsAndroid();
    const isIos = getIsIos();
    const isSupportedOS = isAndroid || isIos;

    if (!isSupportedOS) {
        return null;
    }

    return storeLinks[app][isAndroid ? 'playStore' : 'appStore'];
};
