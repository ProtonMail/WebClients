import * as useUserSettingsModule from '@proton/account';
import type { UserSettings } from '@proton/shared/lib/interfaces';

const defaultUserSettings: UserSettings = {
    '2FA': { Enabled: 0, Allowed: 0, ExpirationTime: null, RegisteredKeys: [] },
    AIAssistantFlags: 0,
    AppWelcome: {},
    BreachAlerts: { Eligible: 0, Value: 0, EmailNotifications: 0 },
    CrashReports: 0,
    DateFormat: 0,
    DeviceRecovery: 0,
    Density: 0,
    EarlyAccess: 0,
    Email: { Value: '', Status: 0, Notify: 0, Reset: 0 },
    Flags: { Welcomed: 0, SupportPgpV6Keys: 0, EdmOptOut: 0, DisplayTrialEndModal: 0 },
    HideSidePanel: 0,
    InvoiceText: '',
    Locale: 'en',
    LogAuth: 0,
    News: 0,
    Password: { Mode: 1, ExpirationTime: 0 },
    Phone: { Value: '', Status: 0, Notify: 0, Reset: 0 },
    HighSecurity: { Eligible: 0, Value: 0 },
    Referral: { Eligible: true, Link: 'https://referral-link' },
    SessionAccountRecovery: 0,
    Telemetry: 0,
    Theme: null,
    ThemeType: 0,
    TimeFormat: 0,
    WeekStart: 0,
    WelcomeFlag: 0,
    Welcome: 0,
    ProductDisabled: { Mail: 0, VPN: 0, Calendar: 0, Drive: 0, Pass: 0, Wallet: 0 },
    UsedClientFlags: 0,
};

export const mockUseUserSettings = (params?: [Partial<UserSettings>?, boolean?]) => {
    const [value, loading = false] = params ?? [];
    const mockedUseUserSettings = jest.spyOn(useUserSettingsModule, 'useUserSettings');
    mockedUseUserSettings.mockReturnValue([
        {
            ...defaultUserSettings,
            ...value,
        },
        loading,
        undefined,
    ]);
    return mockedUseUserSettings;
};
