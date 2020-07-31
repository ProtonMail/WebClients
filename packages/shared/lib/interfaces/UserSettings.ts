import { DENSITY } from '../constants';

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
}
