import { hasBit } from '../helpers/bitset';
import { generateSharedSecret, getUri } from '../helpers/twofa';
import { SETTINGS_2FA_ENABLED, UserSettings } from '../interfaces';

export const TWO_FA_CONFIG = {
    PERIOD: 30,
    DIGITS: 6,
    ALGORITHM: 'SHA1',
};

export const getHasTOTPEnabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.OTP);
};

export const getHasFIDO2Enabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.FIDO2);
};

export const getHasTOTPSettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasTOTPEnabled(userSettings?.['2FA']?.Enabled);
};

export const getHasFIDO2SettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasFIDO2Enabled(userSettings?.['2FA'].Enabled);
};

export const getTOTPData = (identifier: string) => {
    const sharedSecret = generateSharedSecret();
    const period = TWO_FA_CONFIG.PERIOD;
    const digits = TWO_FA_CONFIG.DIGITS;
    const uri = getUri({
        identifier,
        issuer: 'Proton',
        sharedSecret,
        period,
        digits,
        algorithm: TWO_FA_CONFIG.ALGORITHM,
    });
    return {
        sharedSecret,
        digits,
        period,
        uri,
    };
};
