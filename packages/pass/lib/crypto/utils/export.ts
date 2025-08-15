import { CryptoProxy } from '@proton/crypto';
import { loadCoreCryptoWorker } from '@proton/pass/lib/crypto/utils/worker';

/** Encrypts an `Uint8Array` representation of a file/blob:
 * Once support for argon2 is released, then we should pass a config to use
 * that instead - as long as the export feature is alpha, it’s okay to release
 * without argon2, but let’s pass config: { s2kIterationCountByte: 255 } to
 * encryptMessage with the highest security we have atm */
export const encryptPassExport = async (data: Uint8Array<ArrayBuffer>, passphrase: string): Promise<string> => {
    if (!passphrase) throw new Error('Passphrase not provided');

    await loadCoreCryptoWorker();
    return (
        await CryptoProxy.encryptMessage({
            binaryData: data,
            passwords: [passphrase],
            config: { s2kIterationCountByte: 255 },
            format: 'armored',
        })
    ).message;
};

export const decryptPassExport = async (data: string, passphrase: string): Promise<Uint8Array<ArrayBuffer>> => {
    await loadCoreCryptoWorker();

    return (
        await CryptoProxy.decryptMessage({
            armoredMessage: data,
            passwords: [passphrase],
            format: 'binary',
        })
    ).data;
};
