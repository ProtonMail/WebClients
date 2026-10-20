import { CryptoProxy } from '@protontech/crypto';
import { computeKeyPassword, generateKeySalt } from '@protontech/crypto/srp';

import { isPrivate, isSelf } from '../../lib/user/helpers';
import type { Address } from '../interfaces/Address';
import type { Api } from '../interfaces/Api';
import type { DecryptedKey } from '../interfaces/Key';
import type { User } from '../interfaces/User';
import { getHasMigratedAddressKeys } from '../keys/keyMigration';
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

export const getIsMnemonicAvailable = ({ addresses, user }: { addresses: Address[]; user: User }) => {
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    return hasMigratedKeys && isPrivate(user) && isSelf(user);
};
