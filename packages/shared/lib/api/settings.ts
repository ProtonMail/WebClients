import {
    SETTINGS_DATE_FORMAT,
    SETTINGS_LOG_AUTH_STATE,
    SETTINGS_TIME_FORMAT,
    SETTINGS_WEEK_START,
} from '@proton/shared/lib/interfaces';
import { DENSITY } from '@proton/shared/lib/constants';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

export const TOTP_WRONG_ERROR = 12060;

export const getSettings = () => ({
    url: 'settings',
    method: 'get',
});

export const updateUsername = (data: { Username: string }) => ({
    url: 'settings/username',
    method: 'put',
    data,
});

export const updatePassword = () => ({
    url: 'settings/password',
    method: 'put',
});

export const upgradePassword = () => ({
    url: 'settings/password/upgrade',
    method: 'put',
});

export const updateLocale = (Locale: string) => ({
    url: 'settings/locale',
    method: 'put',
    data: { Locale },
});

export const getNews = () => ({
    url: 'settings/news',
    method: 'get',
});

export const updateNews = (News: number) => ({
    url: 'settings/news',
    method: 'put',
    data: { News },
});

export const getNewsExternal = () => ({
    url: 'settings/news/external',
    method: 'get',
});

export const updateNewsExternal = (News: number) => ({
    url: 'settings/news/external',
    method: 'put',
    data: { News },
});

export const updateInvoiceText = (InvoiceText: string) => ({
    url: 'settings/invoicetext',
    method: 'put',
    data: { InvoiceText },
});

export const updateLogAuth = (LogAuth: SETTINGS_LOG_AUTH_STATE) => ({
    url: 'settings/logauth',
    method: 'put',
    data: { LogAuth },
});

export const updateDensity = (Density: DENSITY) => ({
    url: 'settings/density',
    method: 'put',
    data: { Density },
});

export const updateEmail = (data: { Email: string }) => ({
    url: 'settings/email',
    method: 'put',
    data,
});

export const updateNotifyEmail = (Notify: number) => ({
    url: 'settings/email/notify',
    method: 'put',
    data: { Notify },
});

export const updateResetEmail = (Reset: number) => ({
    url: 'settings/email/reset',
    method: 'put',
    data: { Reset },
});

export const verifyEmail = (Token: string) => ({
    url: 'settings/email/verify',
    method: 'post',
    data: { Token },
});

export const updatePhone = (data: { Phone: string }) => ({
    url: 'settings/phone',
    method: 'put',
    data,
});

export const updateNotifyPhone = (Notify: string) => ({
    url: 'settings/phone/notify',
    method: 'put',
    data: { Notify },
});

export const updateResetPhone = (data: { Reset: number }) => ({
    url: 'settings/phone/reset',
    method: 'put',
    data,
});

export const verifyPhone = (Token: string) => ({
    url: 'settings/phone/verify',
    method: 'post',
    data: { Token },
});

export const setupTotp = (TOTPSharedSecret: string, TOTPConfirmation: string) => ({
    url: 'settings/2fa/totp',
    method: 'post',
    data: { TOTPSharedSecret, TOTPConfirmation },
});

export const disableTotp = () => ({
    url: 'settings/2fa/totp',
    method: 'put',
});

export const updateTheme = (Theme: number) => ({
    url: 'settings/theme',
    method: 'put',
    data: { Theme },
});

export const updateThemeType = (ThemeType: ThemeTypes) => ({
    url: 'settings/themetype',
    method: 'put',
    data: { ThemeType },
});

export const updateWeekStart = (WeekStart: SETTINGS_WEEK_START) => ({
    url: 'settings/weekstart',
    method: 'put',
    data: { WeekStart },
});

export const updateDateFormat = (DateFormat: SETTINGS_DATE_FORMAT) => ({
    url: 'settings/dateformat',
    method: 'put',
    data: { DateFormat },
});

export const updateTimeFormat = (TimeFormat: SETTINGS_TIME_FORMAT) => ({
    url: 'settings/timeformat',
    method: 'put',
    data: { TimeFormat },
});

export const updateWelcomeFlags = () => ({
    url: 'settings/welcome',
    method: 'put',
});

export const updateEarlyAccess = (data: { EarlyAccess: number }) => ({
    url: 'settings/earlyaccess',
    method: 'put',
    data,
});

export const updateFlags = (data: { Welcomed: number }) => ({
    url: 'settings/flags',
    method: 'put',
    data,
});

export const updateTelemetry = (data: { Telemetry: number }) => ({
    url: 'settings/telemetry',
    method: 'put',
    data,
});

export const updateCrashReports = (data: { CrashReports: number }) => ({
    url: 'settings/crashreports',
    method: 'put',
    data,
});
