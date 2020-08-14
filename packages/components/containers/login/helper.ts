import { decryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';
import { getPrimaryKeyWithSalt } from 'proton-shared/lib/keys/keys';
import { TWO_FA_FLAGS, PASSWORD_MODE } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { KeySalt as tsKeySalt } from 'proton-shared/lib/interfaces/KeySalt';
import { User as tsUser } from 'proton-shared/lib/interfaces/User';
import { AuthResponse } from 'proton-shared/lib/authentication/interface';

export const getAuthTypes = ({ '2FA': { Enabled }, PasswordMode }: AuthResponse) => {
    return {
        hasTotp: hasBit(Enabled, TWO_FA_FLAGS.TOTP),
        hasU2F: hasBit(Enabled, TWO_FA_FLAGS.U2F),
        hasUnlock: PasswordMode === PASSWORD_MODE.TWO_PASSWORD,
    };
};

export const handleUnlockKey = async (User: tsUser, KeySalts: tsKeySalt[], rawKeyPassword: string) => {
    const { KeySalt, PrivateKey } = getPrimaryKeyWithSalt(User.Keys, KeySalts);

    if (!PrivateKey) {
        throw new Error('Missing private key');
    }

    // Support for versions without a key salt.
    const keyPassword = KeySalt ? ((await computeKeyPassword(rawKeyPassword, KeySalt)) as string) : rawKeyPassword;
    const primaryKey = await decryptPrivateKey(PrivateKey, keyPassword);

    return { primaryKey, keyPassword };
};
