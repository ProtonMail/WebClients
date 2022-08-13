import { CryptoProxy } from '@proton/crypto';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';

import { Api, DecryptedKey } from '../interfaces';
import { srpGetVerify } from '../srp';
import { generateMnemonicBase64RandomBytes, generateMnemonicFromBase64RandomBytes } from './bip39Wrapper';

export interface MnemonicData {
    salt: string;
    randomBytes: string;
    mnemonic: string;
}

export const generateMnemonicWithSalt = async () => {
    const salt = generateKeySalt();
    const randomBytes = generateMnemonicBase64RandomBytes();
    const mnemonic = await generateMnemonicFromBase64RandomBytes(randomBytes);

    return {
        salt,
        randomBytes,
        mnemonic,
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
