import { CryptoProxy } from '@proton/crypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';

import { getHasMigratedAddressKeys } from '../../lib/keys';
import { isPrivate, isSelf } from '../../lib/user/helpers';
import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { MNEMONIC_STATUS } from '../interfaces';
import type { Address, Api, DecryptedKey, User } from '../interfaces';
import { srpGetVerify } from '../srp';
import { generateMnemonicBase64RandomBytes, generateMnemonicFromBase64RandomBytes } from './bip39Wrapper';

export interface GeneratedMnemonicData {
    salt: string;
    randomBytes: string;
    recoveryPhrase: string;
}

export const generateMnemonicWithSalt = async () => {
    const salt = generateKeySalt();
    const randomBytes = generateMnemonicBase64RandomBytes();
    const recoveryPhrase = await generateMnemonicFromBase64RandomBytes(randomBytes);

    return {
        salt,
        randomBytes,
        recoveryPhrase,
    };
};

interface GenerateMnemonicPayloadParams {
    randomBytes: string;
    salt: string;
    userKeys: DecryptedKey[];
    api: Api;
    username: string;
}

export const generateMnemonicPayload = async ({
    randomBytes,
    salt,
    userKeys,
    api,
    username,
}: GenerateMnemonicPayloadParams) => {
    const hashedPassphrase = await computeKeyPassword(randomBytes, salt);
    const reEncryptedKeys = await Promise.all(
        userKeys.map(async ({ ID, privateKey }) => {
            const PrivateKey = await CryptoProxy.exportPrivateKey({
                privateKey,
                passphrase: hashedPassphrase,
            });
            return {
                ID,
                PrivateKey,
            };
        })
    );

    const { Auth } = await srpGetVerify({
        api,
        credentials: {
            username,
            password: randomBytes,
        },
    });

    return {
        MnemonicUserKeys: reEncryptedKeys,
        MnemonicSalt: salt,
        MnemonicAuth: Auth,
    };
};

export const getIsMnemonicAvailable = ({
    addresses,
    user,
    app,
}: {
    addresses: Address[];
    user: User;
    app: APP_NAMES;
}) => {
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const isNonPrivateUser = !isPrivate(user);
    return hasMigratedKeys && !isNonPrivateUser && app !== APPS.PROTONVPN_SETTINGS && isSelf(user);
};

export const getCanReactiveMnemonic = (user: User) => {
    return (
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED
    );
};
