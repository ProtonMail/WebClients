import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import type { NPSConfig } from './interface';

const supportedAppsArray = [APPS.PROTONMAIL, APPS.PROTONCALENDAR] as const;
type SupportedApps = (typeof supportedAppsArray)[number];

export const npsConfig: Record<SupportedApps, NPSConfig> = {
    [APPS.PROTONMAIL]: {
        appName: MAIL_APP_NAME,
        telemetryApp: 'mail',
    },
    [APPS.PROTONCALENDAR]: {
        appName: CALENDAR_APP_NAME,
        telemetryApp: 'calendar',
    },
};

export const isSupportedApp = (app: APP_NAMES): app is SupportedApps => {
    return supportedAppsArray.includes(app as any);
};