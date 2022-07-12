import { ChecklistId } from './Checklist';
import { DENSITY } from '../constants';

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
    AppWelcome: {
        Account?: string[];
        Calendar?: string[];
        Contacts?: string[];
        Mail?: string[];
        Drive?: string[];
    };
    Email: {
        Value: string;
        Status: SETTINGS_STATUS;
        Notify: number;
        Reset: number;
    };
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
    LogAuth: SETTINGS_LOG_AUTH_STATE;
    InvoiceText: number;
    Density: DENSITY;
    Theme: string;
    ThemeType: number;
    WeekStart: SETTINGS_WEEK_START;
    DateFormat: SETTINGS_DATE_FORMAT;
    TimeFormat: SETTINGS_TIME_FORMAT;
    Telemetry: 1 | 0;
    CrashReports: 1 | 0;
    Welcome: number;
    WelcomeFlag: number;
    EarlyAccess: number;
    Flags: Flags;
    Checklists?: ChecklistId[];
    Referral?: {
        /**
         * The referral link
         * will always be a string containing the link.
         */
        Link: string;
        /**
         * 0 - Not elligible to
         * 1 - Elligible to "refer a friend"
         */
        Eligible: boolean;
    };
}
