import { c } from 'ttag';

import type { AuthTypes } from '@proton/components/containers/login/interface';
import { CryptoProxy } from '@proton/crypto';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { getTwoFactorTypes } from '@proton/shared/lib/authentication/twoFactor';
import { type APP_NAMES, PASSWORD_MODE } from '@proton/shared/lib/constants';
import type { KeySalt as tsKeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { User as tsUser } from '@proton/shared/lib/interfaces/User';
import { getPrimaryKeyWithSalt } from '@proton/shared/lib/keys/keys';
import { computeKeyPassword } from '@proton/srp';

/**
 * Get two factor types and password mode for a user signing in.
 */
export const getAuthTypes = ({ info, app }: { info: AuthResponse; app: APP_NAMES }): AuthTypes => {
    const Enabled = info?.['2FA']?.Enabled || 0;
    return {
        twoFactor: getTwoFactorTypes({ enabled: Enabled, app, hostname: location.hostname }),
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

export const getBackupPasswordError = () => {
    const error: any = new Error(c('Error').t`Incorrect backup password. Please try again.`);
    error.name = 'PasswordError';
    error.trace = false;
    return error;
};
