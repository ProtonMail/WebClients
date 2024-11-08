import { useUserSettings } from '@proton/account/userSettings/hooks';
import { APPS, CALENDAR_MOBILE_APP_LINKS, MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/constants';
import { isAndroid as getIsAndroid, isIos as getIsIos } from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';

import type { SmartBannerApp } from './types';

const isUser = {
    [APPS.PROTONCALENDAR]: isCalendarMobileAppUser,
    [APPS.PROTONMAIL]: isMailMobileAppUser,
};

const utmParams = {
    [APPS.PROTONCALENDAR]: {
        appStore: '?pt=106513916&ct=webapp-calendar-topbanner&mt=8',
        playStore: '&utm_source=proton.me&utm_campaign=webapp-calendar-topbanner',
    },
    [APPS.PROTONMAIL]: {
        appStore: '?pt=106513916&ct=webapp-mail-topbanner&mt=8',
        playStore: '&utm_source=webapp&utm_campaign=webapp-mail-topbanner',
    },
};

const storeLinks = {
    [APPS.PROTONCALENDAR]: CALENDAR_MOBILE_APP_LINKS,
    [APPS.PROTONMAIL]: MAIL_MOBILE_APP_LINKS,
};

type StoreType = keyof (
    | Omit<typeof CALENDAR_MOBILE_APP_LINKS, 'qrCode'>
    | Omit<typeof MAIL_MOBILE_APP_LINKS, 'qrCode'>
);

const getStoreLink = (app: SmartBannerApp, store: StoreType) => storeLinks[app][store] + utmParams[app][store];

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

    return getStoreLink(app, isAndroid ? 'playStore' : 'appStore');
};
