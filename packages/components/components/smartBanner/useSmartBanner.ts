import { useUserSettings } from '@proton/account/userSettings/hooks';
import { CALENDAR_MOBILE_APP_LINKS } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isAndroid as getIsAndroid, isIos as getIsIos } from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/mail/constants';

import type { SmartBannerApp } from './types';

type StoreType = keyof (
    | Omit<typeof CALENDAR_MOBILE_APP_LINKS, 'qrCode'>
    | Omit<typeof MAIL_MOBILE_APP_LINKS, 'qrCode'>
);

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

const getStoreLink = (app: SmartBannerApp, store: StoreType): string => {
    return storeLinks[app][store] + utmParams[app][store];
};

const isMobileDevice = (): boolean => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const useSmartBanner = (app: SmartBannerApp): string | null => {
    const [userSettings] = useUserSettings();
    const hasUsedNativeApp = isUser[app](BigInt(userSettings.UsedClientFlags));

    if (hasUsedNativeApp) return null;

    if (isMobileDevice()) return null;

    const isAndroid = getIsAndroid();
    const isIos = getIsIos();
    const isSupportedOS = isAndroid || isIos;

    if (!isSupportedOS) return null;

    return getStoreLink(app, isAndroid ? 'playStore' : 'appStore');
};
