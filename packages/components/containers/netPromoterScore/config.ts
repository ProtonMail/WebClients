import { CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { NPSApplication, type NetPromoterScoreConfig } from './interface';

export const npsConfig: Record<string, NetPromoterScoreConfig> = {
    [NPSApplication.WebMail]: {
        appName: MAIL_APP_NAME,
    },
    [NPSApplication.DesktopMail]: {
        appName: MAIL_APP_NAME,
    },
    [NPSApplication.WebCalendar]: {
        appName: CALENDAR_APP_NAME,
    },    
    [NPSApplication.DesktopCalendar]: {
        appName: CALENDAR_APP_NAME,
    },
};