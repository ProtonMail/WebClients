import { c } from 'ttag';

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

export const getAnniversary2025Title = (appName?: APP_NAMES): string => {
    switch (appName) {
        case APPS.PROTONMAIL:
            return c('anniversary_2025: Offer').t`Save big on premium Mail features with a limited-time discount.`;
        case APPS.PROTONPASS:
            return c('anniversary_2025: Offer').t`Save big on premium Pass features with a limited-time discount.`;
        case APPS.PROTONDRIVE:
            return c('anniversary_2025: Offer').t`Save big on premium Drive features with a limited-time discount.`;
        case APPS.PROTONVPN_SETTINGS:
            return c('anniversary_2025: Offer').t`Save big on premium VPN features with a limited-time discount.`;
        default:
            return c('anniversary_2025: Offer').t`Here's an exclusive gift to celebrate our journey together.`;
    }
};
