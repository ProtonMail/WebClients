import { UserSettings, SETTINGS_2FA_ENABLED } from '../interfaces';
import { hasBit } from '../helpers/bitset';
import { generateSharedSecret, getUri } from '../helpers/twofa';

export const TWO_FA_CONFIG = {
    PERIOD: 30,
    DIGITS: 6,
    ALGORITHM: 'SHA1',
};

export const getHasTOTPEnabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.OTP);
};

export const getHasU2FEnabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.U2F);
};

export const getHasTOTPSettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasTOTPEnabled(userSettings?.['2FA']?.Enabled);
};

export const getHasU2FSettingEnabled = (userSettings?: Pick<UserSettings, '2FA'>) => {
    return getHasU2FEnabled(userSettings?.['2FA'].Enabled);
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
