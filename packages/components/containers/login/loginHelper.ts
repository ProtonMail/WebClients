import { AuthTypes } from '@proton/components/containers/login/interface';
import { CryptoProxy } from '@proton/crypto';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { PASSWORD_MODE } from '@proton/shared/lib/constants';
import { getHasWebAuthnSupport } from '@proton/shared/lib/helpers/browser';
import { KeySalt as tsKeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import { User as tsUser } from '@proton/shared/lib/interfaces/User';
import { getPrimaryKeyWithSalt } from '@proton/shared/lib/keys/keys';
import { getHasTOTPEnabled, getHasFIDO2Enabled } from '@proton/shared/lib/settings/twoFactor';
import { computeKeyPassword } from '@proton/srp';

export const getAuthTypes = ({ '2FA': { Enabled }, PasswordMode }: AuthResponse, hasFido2: boolean): AuthTypes => {
    return {
        totp: getHasTOTPEnabled(Enabled),
        fido2: getHasFIDO2Enabled(Enabled) && getHasWebAuthnSupport() && hasFido2,
        unlock: PasswordMode === PASSWORD_MODE.TWO_PASSWORD,
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

    return { primaryKey, keyPassword };
};
