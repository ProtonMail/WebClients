import { computeKeyPassword } from 'pm-srp';
import { getPrimaryKeyWithSalt, decryptPrivateKeyArmored } from 'proton-shared/lib/keys/keys';
import { TWO_FA_FLAGS, PASSWORD_MODE } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

export const getAuthTypes = ({ '2FA': { Enabled }, PasswordMode } = {}) => {
    return {
        hasTotp: hasBit(Enabled, TWO_FA_FLAGS.TOTP),
        hasU2F: hasBit(Enabled, TWO_FA_FLAGS.U2F),
        hasUnlock: PasswordMode === PASSWORD_MODE.TWO_PASSWORD
    };
};

export const getErrorText = (error) => {
    if (error.data && error.data.Error) {
        return error.data.Error;
    }
    return error.message;
};

export const handleUnlockKey = async (User, KeySalts, rawKeyPassword) => {
    const { KeySalt, PrivateKey } = getPrimaryKeyWithSalt(User.Keys, KeySalts);

    // Support for versions without a key salt.
    const keyPassword = KeySalt ? await computeKeyPassword(rawKeyPassword, KeySalt) : rawKeyPassword;
    const primaryKey = await decryptPrivateKeyArmored(PrivateKey, keyPassword);

    return { primaryKey, keyPassword };
};
