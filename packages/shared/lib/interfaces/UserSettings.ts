import { DENSITY } from '../constants';

export enum SETTINGS_WEEK_START {
    LOCALE_DEFAULT = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
    SUNDAY = 7,
}

export enum SETTINGS_DATE_FORMAT {
    LOCALE_DEFAULT = 0,
    DDMMYYYY = 1,
    MMDDYYYY = 2,
    YYYYMMDD = 3,
}

export enum SETTINGS_TIME_FORMAT {
    LOCALE_DEFAULT = 0,
    H24 = 1,
    H12 = 2,
}

export interface UserSettings {
    Email: {
        Value: string;
        Status: number;
        Notify: number;
        Reset: number;
    };
    Phone: {
        Value: string;
        Status: number;
        Notify: number;
        Reset: number;
    };
    Password: {
        Mode: number;
        ExpirationTime: number; // If set, after this time force password change
    };
    '2FA': {
        Enabled: number; // 0 for disabled, 1 for OTP, 2 for U2F, 3 for both
        Allowed: number; // 0 for disabled, 1 for OTP, 2 for U2F, 3 for both
        ExpirationTime: number; // If set, after this time force add 2FA
        U2FKeys: [
            {
                Label: string;
                KeyHandle: string;
                Compromised: number;
            }
        ];
    };
    News: number;
    Locale: string;
    LogAuth: number;
    InvoiceText: number;
    Density: DENSITY;
    Theme: string;
    ThemeType: number;
    WeekStart: SETTINGS_WEEK_START;
    DateFormat: SETTINGS_DATE_FORMAT;
    TimeFormat: SETTINGS_TIME_FORMAT;
}
