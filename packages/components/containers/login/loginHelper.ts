import { c } from 'ttag';

import type { AuthTypes } from '@proton/components/containers/login/interface';
import { CryptoProxy } from '@proton/crypto';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { PASSWORD_MODE } from '@proton/shared/lib/constants';
import type { KeySalt as tsKeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { User as tsUser } from '@proton/shared/lib/interfaces/User';
import { getPrimaryKeyWithSalt } from '@proton/shared/lib/keys/keys';
import { getHasFIDO2Enabled, getHasTOTPEnabled } from '@proton/shared/lib/settings/twoFactor';
import { getHasFIDO2Support } from '@proton/shared/lib/webauthn/helper';
import { computeKeyPassword } from '@proton/srp';

export const getAuthTypes = (info: AuthResponse, app: APP_NAMES): AuthTypes => {
    const Enabled = info?.['2FA']?.Enabled || 0;
    return {
        totp: getHasTOTPEnabled(Enabled),
        fido2: getHasFIDO2Enabled(Enabled) && getHasFIDO2Support(app, location.hostname),
        unlock: info?.PasswordMode === PASSWORD_MODE.TWO_PASSWORD,
    };
};

export const handleUnlockKey = async (User: tsUser, KeySalts: tsKeySalt[], rawKeyPassword: string) => {
    const { KeySalt, PrivateKey } = getPrimaryKeyWithSalt(User.Keys, KeySalts);

    if (!PrivateKey) {
        throw new Error('Missing private key');
    }

    // Support for versions without a key salt.
    const keyPassword = KeySalt ? ((await computeKeyPassword(rawKeyPassword, KeySalt)) as string) : rawKeyPassword;
    const primaryKey = await CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: keyPassword });

    return {
        primaryKey,
        keyPassword,
    };
};

export const getUnlockError = () => {
    const error: any = new Error(c('Error').t`Incorrect second password. Please try again.`);
    error.name = 'PasswordError';
    error.trace = false;
    return error;
};
