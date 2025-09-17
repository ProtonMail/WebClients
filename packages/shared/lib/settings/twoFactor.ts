import { getHasFIDO2Enabled, getHasTOTPEnabled } from '../authentication/twoFactor';
import type { UserSettings } from '../interfaces';

export const TOTP_CONFIG = {
    PERIOD: 30,
    DIGITS: 6,
    ALGORITHM: 'SHA1',
};

export const getHasTOTPSettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasTOTPEnabled(userSettings?.['2FA']?.Enabled);
};

export const getHasFIDO2SettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasFIDO2Enabled(userSettings?.['2FA'].Enabled);
};

interface GetUriArguments {
    identifier: string;
    sharedSecret: string;
    issuer?: string;
    digits?: number;
    algorithm?: string;
    period?: number;
}

export const getUri = ({
    identifier,
    sharedSecret,
    issuer = 'ProtonMail',
    digits = 6,
    algorithm = 'SHA1',
    period = 30,
}: GetUriArguments) => {
    return `otpauth://totp/${identifier}?secret=${sharedSecret}&issuer=${issuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
};

export const getTOTPData = (identifier: string, sharedSecret: string) => {
    const period = TOTP_CONFIG.PERIOD;
    const digits = TOTP_CONFIG.DIGITS;
    const uri = getUri({
        identifier,
        issuer: 'Proton',
        sharedSecret,
        period,
        digits,
        algorithm: TOTP_CONFIG.ALGORITHM,
    });
    return {
        sharedSecret,
        digits,
        period,
        uri,
    };
};
