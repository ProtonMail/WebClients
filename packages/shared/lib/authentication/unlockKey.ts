import { CryptoProxy } from '@protontech/crypto';
import { computeKeyPassword } from '@protontech/crypto/srp';

import type { KeySalt as tsKeySalt } from '../interfaces/KeySalt';
import type { User as tsUser } from '../interfaces/User';
import { getPrimaryKeyWithSalt } from '../keys/keys';

/** Derives the key password from the user's key salt and unlocks their primary key with it. */
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
