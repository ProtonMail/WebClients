import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { Environment } from '@proton/shared/lib/environment/helper';
import { doesNotSupportEarlyAccessVersion } from '@proton/shared/lib/helpers/browser';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import { UserSettings } from '@proton/shared/lib/interfaces';

import { Feature } from '../containers/features/FeaturesContext';
import {
    getTargetEnvironment,
    getVersionCookieIsValid,
    updateVersionCookie,
    versionCookieAtLoad,
} from '../hooks/useEarlyAccess';

const MAX_NUMBER_OF_EARLY_ACCESS_DESYNCHRONIZATION_RETRIES = 2;

// Set to -1 in browser to disable auto refresh
const EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY = 'EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY';

const getCurrentRetries = () => {
    const currentRetries = Number(getItem(EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY));
    if (Number.isNaN(currentRetries)) {
        return undefined;
    }

    return currentRetries;
};

export const setCurrentRetries = (currentRetries: number) => {
    setItem(EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY, `${currentRetries}`);
};

const removeCurrentRetries = () => {
    removeItem(EARLY_ACCESS_DESYNCHRONIZATION_RETRIES_STORAGE_KEY);
};

export const handleEarlyAccessDesynchronization = ({
    userSettings,
    earlyAccessScope,
    appName,
}: {
    userSettings: UserSettings;
    earlyAccessScope: Feature<Environment> | undefined;
    appName: APP_NAMES;
}) => {
    if (doesNotSupportEarlyAccessVersion()) {
        return;
    }

    const currentRetries = getCurrentRetries() || 0;
    if (currentRetries >= MAX_NUMBER_OF_EARLY_ACCESS_DESYNCHRONIZATION_RETRIES || currentRetries < 0) {
        return;
    }

    // TEMP: Exempt 'relaunch' from desynchronisation reload while it's under wraps
    if ((versionCookieAtLoad as any) === 'relaunch') {
        return;
    }

    const normalizedVersionCookieAtLoad = getVersionCookieIsValid(versionCookieAtLoad, earlyAccessScope)
        ? versionCookieAtLoad
        : undefined;
    const targetEnvironment = getTargetEnvironment(earlyAccessScope, Boolean(userSettings.EarlyAccess));
    const environmentIsDesynchronized = normalizedVersionCookieAtLoad !== targetEnvironment;
    const isVpnSettings = appName === APPS.PROTONVPN_SETTINGS;

    const shouldUpdateToEarlyAccessVersion = !isVpnSettings && environmentIsDesynchronized;
    if (shouldUpdateToEarlyAccessVersion) {
        return () => {
            setCurrentRetries(currentRetries + 1);
            updateVersionCookie(targetEnvironment, earlyAccessScope);
            window.location.reload();
        };
    }

    removeCurrentRetries();
};
