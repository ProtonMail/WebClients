import type { ThemeSetting } from '@proton/shared/lib/themes/themes';

import { DENSITY } from '../constants';
import { RegisteredKey } from '../webauthn/interface';
import { ChecklistId } from './Checklist';

export enum SETTINGS_STATUS {
    UNVERIFIED = 0,
    VERIFIED = 1,
    INVALID = 2,
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

export enum SETTINGS_PROTON_SENTINEL_STATE {
    DISABLED = 0,
    ENABLED = 1,
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
    FIDO2 = 2,
}

export const enum DRAWER_VISIBILITY {
    SHOW = 0,
    HIDE = 1,
}

export interface Flags {
    Welcomed: number;
}

export interface UserSettings {
    '2FA': {
        Enabled: number; // 0 for disabled, 1 for OTP, 2 for FIDO2, 3 for both
        Allowed: number; // 0 for disabled, 1 for OTP, 2 for FIDO2, 3 for both
        ExpirationTime: number | null; // If set, after this time force add 2FA
        RegisteredKeys: RegisteredKey[];
    };
    AppWelcome: {
        Account?: string[];
        Calendar?: string[];
        Contacts?: string[];
        Mail?: string[];
        Drive?: string[];
    };
    BreachAlerts: {
        Eligible: number; // 0 for free user, 1 for paid user
        Value: number; // 0 for disabled, 1 for enabled
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
    HideSidePanel: DRAWER_VISIBILITY;
    InvoiceText: string;
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
    HighSecurity: {
        /**
         * 1 => user can enable High Security, 0 => can't enable
         */
        Eligible: 1 | 0;
        /**
         * 1 => user has High Security enabled, 0 => disabled
         */
        Value: SETTINGS_PROTON_SENTINEL_STATE;
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
    SessionAccountRecovery: 1 | 0;
    Telemetry: 1 | 0;
    Theme: ThemeSetting | null;
    ThemeType: number;
    TimeFormat: SETTINGS_TIME_FORMAT;
    WeekStart: SETTINGS_WEEK_START;
    WelcomeFlag: number;
    Welcome: number;
}
