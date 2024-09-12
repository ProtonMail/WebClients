import useUserSettings from '@proton/components/hooks/useUserSettings';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import {
    isAndroid as getIsAndroid,
    isIos as getIsIos,
    isSafari as getIsSafari,
    isStandaloneApp as getIsStandaloneApp,
    getOS,
} from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';

const isUser = {
    [APPS.PROTONCALENDAR]: isCalendarMobileAppUser,
    [APPS.PROTONMAIL]: isMailMobileAppUser,
};

export const useSmartBanner = (appName: APP_NAMES) => {
    // We can't (easily) detect if a user has downloaded/installed the native app, but
    // we can check if the user has ever used the app. If they have, don't render the banner.
    const [userSettings] = useUserSettings();

    const hasUsedNativeApp = isUser[appName as keyof typeof isUser](BigInt(userSettings.UsedClientFlags));

    if (hasUsedNativeApp) {
        return null;
    }

    // The banner is only supported on non-standalone iOS and Android devices.
    const isAndroid = getIsAndroid();
    const isIos = getIsIos();
    const isSupportedOS = isAndroid || isIos;
    const isStandaloneApp = getIsStandaloneApp();
    const isBannerSupported = isSupportedOS && !isStandaloneApp;

    if (!isBannerSupported) {
        return null;
    }

    // Apple's Smart Banner will display on Safari on devices running iOS version 6 or higher.
    // This check avoids rendering our banner when the Smart Banner is also displayed.
    const isSafari = getIsSafari();
    const { version: osVersion } = getOS();

    if (isSafari && Number(osVersion) >= 6) {
        return null;
    }

    // We need the correct meta tag in order to get the app Id and link to the store.
    // If the meta tag isn't found in the DOM, don't render the banner.
    const metaTag: HTMLMetaElement | null = document.querySelector(
        `meta[name="${isAndroid ? 'google-play-app' : 'apple-itunes-app'}"]`
    );

    if (!metaTag) {
        return null;
    }

    const appId = metaTag.content.split('=')[1] ?? '';

    const storeLink = isAndroid ? 'market://details?id=' : 'https://itunes.apple.com/app/id';

    return storeLink + appId;
};
