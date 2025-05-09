import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

const VALID_STANDALONE_APPS = [
    APPS.PROTONPASS,
    APPS.PROTONDRIVE,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
] as const;

export const isValidStandaloneApp = (appName?: APP_NAMES): boolean => {
    if (!appName) {
        return false;
    }
    return (VALID_STANDALONE_APPS as readonly string[]).includes(appName);
};
