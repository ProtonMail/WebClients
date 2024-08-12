import type { DENSITY, NEWSLETTER_SUBSCRIPTIONS } from '@proton/shared/lib/constants';
import type {
    AI_ASSISTANT_ACCESS,
    DRAWER_VISIBILITY,
    SETTINGS_DATE_FORMAT,
    SETTINGS_LOG_AUTH_STATE,
    SETTINGS_TIME_FORMAT,
    SETTINGS_WEEK_START,
} from '@proton/shared/lib/interfaces';
import type { ThemeSetting, ThemeTypes } from '@proton/shared/lib/themes/themes';

import type { RegistrationOptions } from '../../lib/webauthn/interface';

export const TOTP_WRONG_ERROR = 12060;

export const getSettings = () => ({
    url: 'core/v4/settings',
    method: 'get',
});

export const updateUsername = (data: { Username: string }) => ({
    url: 'core/v4/settings/username',
    method: 'put',
    data,
});

export const updatePassword = (data: { PersistPasswordScope: boolean }) => ({
    url: 'core/v4/settings/password',
    method: 'put',
    data,
});

export const upgradePassword = () => ({
    url: 'core/v4/settings/password/upgrade',
    method: 'put',
});

export const updateLocale = (Locale: string) => ({
    url: 'core/v4/settings/locale',
    method: 'put',
    data: { Locale },
});

export const getNews = () => ({
    url: 'core/v4/settings/news',
    method: 'get',
});

export const patchNews = (data: Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>) => ({
    url: 'core/v4/settings/news',
    method: 'PATCH',
    data,
});

export const getNewsExternal = () => ({
    url: 'core/v4/settings/news/external',
    method: 'get',
});

export const patchNewsExternal = (data: Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>) => ({
    url: 'core/v4/settings/news/external',
    method: 'PATCH',
    data,
});

export const updateInvoiceText = (InvoiceText: string) => ({
    url: 'core/v4/settings/invoicetext',
    method: 'put',
    data: { InvoiceText },
});

export const updateLogAuth = (LogAuth: SETTINGS_LOG_AUTH_STATE) => ({
    url: 'core/v4/settings/logauth',
    method: 'put',
    data: { LogAuth },
});

export const enableHighSecurity = () => ({
    url: 'core/v4/settings/highsecurity',
    method: 'post',
    data: {},
});

export const disableHighSecurity = () => ({
    url: 'core/v4/settings/highsecurity',
    method: 'delete',
    data: {},
});

export const updateDensity = (Density: DENSITY) => ({
    url: 'core/v4/settings/density',
    method: 'put',
    data: { Density },
});

export const updateEmail = (data: { Email: string; PersistPasswordScope?: boolean }) => ({
    url: 'core/v4/settings/email',
    method: 'put',
    data,
});

export const updateNotifyEmail = (Notify: number) => ({
    url: 'core/v4/settings/email/notify',
    method: 'put',
    data: { Notify },
});

export const updateResetEmail = (data: { Reset: number; PersistPasswordScope?: boolean }) => ({
    url: 'core/v4/settings/email/reset',
    method: 'put',
    data,
});

export const verifyEmail = (Token: string) => ({
    url: 'core/v4/settings/email/verify',
    method: 'post',
    data: { Token },
});

export const updatePhone = (data: { Phone: string; PersistPasswordScope?: boolean }) => ({
    url: 'core/v4/settings/phone',
    method: 'put',
    data,
});

export const updateNotifyPhone = (Notify: string) => ({
    url: 'core/v4/settings/phone/notify',
    method: 'put',
    data: { Notify },
});

export const updateResetPhone = (data: { Reset: number; PersistPasswordScope?: boolean }) => ({
    url: 'core/v4/settings/phone/reset',
    method: 'put',
    data,
});

export const verifyPhone = (Token: string) => ({
    url: 'core/v4/settings/phone/verify',
    method: 'post',
    data: { Token },
});

export const registerSecurityKey = (data: {
    RegistrationOptions: RegistrationOptions;
    ClientData: string;
    AttestationObject: string;
    Transports: string[];
    Name: string;
}) => ({
    url: 'core/v4/settings/2fa/register',
    method: 'post',
    data,
});

export const getSecurityKeyChallenge = (crossPlatform: boolean) => ({
    url: 'core/v4/settings/2fa/register',
    method: 'get',
    params: {
        CrossPlatform: +crossPlatform,
    },
});

export const removeSecurityKey = (credentialID: string, data: { PersistPasswordScope?: boolean } = {}) => ({
    url: `core/v4/settings/2fa/${credentialID}/remove`,
    method: 'post',
    data,
});

export const renameSecurityKey = (credentialID: string, data: { Name: string }) => ({
    url: `core/v4/settings/2fa/${credentialID}/rename`,
    method: 'put',
    data,
});

export const setupTotp = (TOTPSharedSecret: string, TOTPConfirmation: string) => ({
    url: 'core/v4/settings/2fa/totp',
    method: 'post',
    data: { TOTPSharedSecret, TOTPConfirmation },
});

export const disableTotp = () => ({
    url: 'core/v4/settings/2fa/totp',
    method: 'put',
});

export const disable2FA = () => ({
    url: 'core/v4/settings/2fa',
    method: 'put',
});

export const updateHideDrawer = (HideSidePanel: DRAWER_VISIBILITY) => ({
    url: 'core/v4/settings/hide-side-panel',
    method: 'put',
    data: { HideSidePanel },
});

export const updateTheme = (data: ThemeSetting) => ({
    url: 'core/v4/settings/theme',
    method: 'put',
    data,
});

export const updateThemeType = (ThemeType: ThemeTypes) => ({
    url: 'core/v4/settings/themetype',
    method: 'put',
    data: { ThemeType },
});

export const updateWeekStart = (WeekStart: SETTINGS_WEEK_START) => ({
    url: 'core/v4/settings/weekstart',
    method: 'put',
    data: { WeekStart },
});

export const updateDateFormat = (DateFormat: SETTINGS_DATE_FORMAT) => ({
    url: 'core/v4/settings/dateformat',
    method: 'put',
    data: { DateFormat },
});

export const updateTimeFormat = (TimeFormat: SETTINGS_TIME_FORMAT) => ({
    url: 'core/v4/settings/timeformat',
    method: 'put',
    data: { TimeFormat },
});

export const updateWelcomeFlags = () => ({
    url: 'core/v4/settings/welcome',
    method: 'put',
});

export const updateEarlyAccess = (data: { EarlyAccess: number }) => ({
    url: 'core/v4/settings/earlyaccess',
    method: 'put',
    data,
});

export const updateFlags = (data: { Welcomed: number }) => ({
    url: 'core/v4/settings/flags',
    method: 'put',
    data,
});

export const updateTelemetry = (data: { Telemetry: number }) => ({
    url: 'core/v4/settings/telemetry',
    method: 'put',
    data,
});

export const updateCrashReports = (data: { CrashReports: number }) => ({
    url: 'core/v4/settings/crashreports',
    method: 'put',
    data,
});

export const getBreaches = () => ({
    url: 'account/v4/breaches',
    method: 'get',
});

export const getRecentBreaches = () => ({
    url: 'account/v4/breaches?Recent=true',
    method: 'get',
});

export const enableBreachAlert = () => ({
    url: 'core/v4/settings/breachalerts',
    method: 'post',
    data: {},
});

export const setProductDisabled = (data: { Product: number; Disabled: 1 | 0 }) => ({
    url: 'core/v4/settings/product-disabled',
    method: 'put',
    data,
});

export const disableBreachAlert = () => ({
    url: 'core/v4/settings/breachalerts',
    method: 'delete',
    data: {},
});

export const updateAIAssistant = (AIAssistantFlags: AI_ASSISTANT_ACCESS) => ({
    url: 'core/v4/settings/ai-assistant-flags',
    method: 'put',
    data: { AIAssistantFlags },
});
