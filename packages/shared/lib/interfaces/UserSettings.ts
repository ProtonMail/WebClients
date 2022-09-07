import { DENSITY } from '../constants';
import { ChecklistId } from './Checklist';

export enum SETTINGS_STATUS {
    UNVERIFIED = 0,
    VERIFIED = 1,
}

export enum SETTINGS_PASSWORD_MODE {
    ONE_PASSWORD_MODE = 1,
    TWO_PASSWORD_MODE = 2,
}

export enum SETTINGS_LOG_AUTH_STATE {
    DISABLE = 0,
    BASIC = 1,
    ADVANCED = 2,
}

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

export enum SETTINGS_2FA_ENABLED {
    OTP = 1,
    U2F = 2,
}

export interface Flags {
    Welcomed: number;
}

export interface UserSettings {
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
    AppWelcome: {
        Account?: string[];
        Calendar?: string[];
        Contacts?: string[];
        Mail?: string[];
        Drive?: string[];
    };
    Checklists?: ChecklistId[];
    CrashReports: 1 | 0;
    DateFormat: SETTINGS_DATE_FORMAT;
    DeviceRecovery: 0 | 1;
    Density: DENSITY;
    EarlyAccess: number;
    Email: {
        Value: string;
        Status: SETTINGS_STATUS;
        Notify: number;
        Reset: number;
    };
    Flags: Flags;
    InvoiceText: number;
    Locale: string;
    LogAuth: SETTINGS_LOG_AUTH_STATE;
    News: number;
    Phone: {
        Value: string;
        Status: SETTINGS_STATUS;
        Notify: number;
        Reset: number;
    };
    Password: {
        Mode: SETTINGS_PASSWORD_MODE;
        ExpirationTime: number; // If set, after this time force password change
    };
    Referral?: {
        /**
         * 0 - Not elligible to
         * 1 - Elligible to "refer a friend"
         */
        Eligible: boolean;
        /**
         * The referral link
         * will always be a string containing the link.
         */
        Link: string;
    };
    Telemetry: 1 | 0;
    Theme: string;
    ThemeType: number;
    TimeFormat: SETTINGS_TIME_FORMAT;
    WeekStart: SETTINGS_WEEK_START;
    WelcomeFlag: number;
    Welcome: number;
}
