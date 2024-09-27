import type { ThemeSetting } from '@proton/shared/lib/themes/themes';

import type { DENSITY } from '../constants';
import type { RegisteredKey } from '../webauthn/interface';
import type { ChecklistId } from './Checklist';

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

export enum DARK_WEB_MONITORING_STATE {
    DISABLED = 0,
    ENABLED = 1,
}

export enum DARK_WEB_MONITORING_EMAILS_STATE {
    DISABLED = 0,
    ENABLED = 1,
}

export enum DARK_WEB_MONITORING_ELIGIBILITY_STATE {
    NONPAID = 0,
    PAID = 1,
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

export enum AI_ASSISTANT_ACCESS {
    UNSET = 0,
    OFF = 1,
    SERVER_ONLY = 2,
    CLIENT_ONLY = 3,
}

export const USED_CLIENT_FLAGS = {
    OTHER: BigInt(Math.pow(2, 0)),
    // Available: BigInt(Math.pow(2, 1)),
    WEB_DOCS: BigInt(Math.pow(2, 2)),
    IMPORT_EXPORT: BigInt(Math.pow(2, 3)),
    BRIDGE: BigInt(Math.pow(2, 4)),
    ADMIN: BigInt(Math.pow(2, 5)),
    WEB_VPN_SETTINGS: BigInt(Math.pow(2, 6)),
    WEB_MAIL_SETTINGS: BigInt(Math.pow(2, 7)),
    WEB: BigInt(Math.pow(2, 8)),
    WEB_CALENDAR: BigInt(Math.pow(2, 9)),
    WEB_CONTACTS: BigInt(Math.pow(2, 10)),
    WEB_DRIVE: BigInt(Math.pow(2, 11)),
    WEB_MAIL: BigInt(Math.pow(2, 12)),
    WEB_VPN: BigInt(Math.pow(2, 13)),
    WEB_ACCOUNT: BigInt(Math.pow(2, 14)),
    WEB_WALLET: BigInt(Math.pow(2, 15)),
    IOS_WALLET: BigInt(Math.pow(2, 16)),
    ANDROID_WALLET: BigInt(Math.pow(2, 17)),
    WINDOWS_WALLET: BigInt(Math.pow(2, 18)),
    LINUX_WALLET: BigInt(Math.pow(2, 19)),
    BROWSER_VPN: BigInt(Math.pow(2, 20)),
    MACOS_WALLET: BigInt(Math.pow(2, 21)),
    WINDOWS_INBOX: BigInt(Math.pow(2, 22)),
    WEB_ADMIN: BigInt(Math.pow(2, 23)),
    WINDOWS_EPPIE: BigInt(Math.pow(2, 24)),
    WINDOWS_BRIDGE: BigInt(Math.pow(2, 25)),
    WINDOWS_DRIVE: BigInt(Math.pow(2, 26)),
    WINDOWS_IMPORT_EXPORT: BigInt(Math.pow(2, 27)),
    WINDOWS_VPN: BigInt(Math.pow(2, 28)),
    WINDOWS_EXPORT: BigInt(Math.pow(2, 29)),
    LINUX_EPPIE: BigInt(Math.pow(2, 30)),
    LINUX_EXPORT: BigInt(Math.pow(2, 31)),
    LINUX_IMPORT_EXPORT: BigInt(Math.pow(2, 32)),
    LINUX_BRIDGE: BigInt(Math.pow(2, 33)),
    LINUX_VPN: BigInt(Math.pow(2, 34)),
    LINUX_PASS: BigInt(Math.pow(2, 35)),
    ANDROID_PASS: BigInt(Math.pow(2, 36)),
    IOS_PASS: BigInt(Math.pow(2, 37)),
    WEB_PASS: BigInt(Math.pow(2, 38)),
    MACOS_PASS: BigInt(Math.pow(2, 39)),
    WINDOWS_PASS: BigInt(Math.pow(2, 40)),
    MACOS_BRIDGE: BigInt(Math.pow(2, 41)),
    MACOS_DRIVE: BigInt(Math.pow(2, 42)),
    MACOS_IMPORT_EXPORT: BigInt(Math.pow(2, 43)),
    MACOS_VPN: BigInt(Math.pow(2, 44)),
    MACOS_EXPORT: BigInt(Math.pow(2, 45)),
    MACOS_EPPIE: BigInt(Math.pow(2, 46)),
    MACOS_INBOX: BigInt(Math.pow(2, 47)),
    IOS: BigInt(Math.pow(2, 48)),
    IOS_CALENDAR: BigInt(Math.pow(2, 49)),
    // Available: BigInt(Math.pow(2, 50)),
    IOS_DRIVE: BigInt(Math.pow(2, 51)),
    IOS_MAIL: BigInt(Math.pow(2, 52)),
    IOS_VPN: BigInt(Math.pow(2, 53)),
    IOS_EPPIE: BigInt(Math.pow(2, 54)),
    LINUX_INBOX: BigInt(Math.pow(2, 55)),
    ANDROID: BigInt(Math.pow(2, 56)),
    ANDROID_CALENDAR: BigInt(Math.pow(2, 57)),
    ANDROID_EPPIE: BigInt(Math.pow(2, 58)),
    ANDROID_DRIVE: BigInt(Math.pow(2, 59)),
    ANDROID_MAIL: BigInt(Math.pow(2, 60)),
    ANDROID_VPN: BigInt(Math.pow(2, 61)),
    ANDROID_TV_VPN: BigInt(Math.pow(2, 62)),
    APPLE_TV_VPN: BigInt(Math.pow(2, 63)),
};

export interface UserSettings {
    '2FA': {
        Enabled: number; // 0 for disabled, 1 for OTP, 2 for FIDO2, 3 for both
        Allowed: number; // 0 for disabled, 1 for OTP, 2 for FIDO2, 3 for both
        ExpirationTime: number | null; // If set, after this time force add 2FA
        RegisteredKeys: RegisteredKey[];
    };
    AIAssistantFlags: AI_ASSISTANT_ACCESS;
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
        EmailNotifications: number;
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
    ProductDisabled: {
        Mail: number;
        VPN: number;
        Calendar: number;
        Drive: number;
        Pass: number;
        Wallet: number;
    };
    UsedClientFlags: number;
}
