import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { Address, Key } from '@proton/shared/lib/interfaces';

export async function generatePrivateKey(name = 'name', email = 'name@example.com'): Promise<PrivateKeyReference> {
    const { privateKeys } = await generateKeys(name, email);
    if (privateKeys.length !== 1) {
        throw new Error('Private key was not generated');
    }
    return privateKeys[0];
}

export async function generateKeys(name = 'name', email = 'name@example.com') {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name, email }],
    });
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: null });
    const publicKey = await CryptoProxy.importPublicKey({ armoredKey: privateKeyArmored });
    const publicKeyArmored = await CryptoProxy.exportPublicKey({ key: publicKey });

    return {
        name,
        email,
        publicKeyArmored,
        privateKeyArmored,
        publicKeys: [publicKey],
        privateKeys: [privateKey],
    };
}

type SessionKeyAlgorithm = Parameters<typeof CryptoProxy.generateSessionKeyForAlgorithm>[0];
export async function generateSessionKey(algorithm: SessionKeyAlgorithm = 'aes256'): Promise<SessionKey> {
    return {
        data: await CryptoProxy.generateSessionKeyForAlgorithm(algorithm),
        algorithm,
    };
}

export const generateAddress = async (keys: Key[], email = 'test@pm.me'): Promise<Address> => {
    return {
        Email: email,
        Keys: keys,
    } as Address;
};

/**
 * Load Crypto API outside of web workers, for testing purposes.
 */
export async function setupCryptoProxyForTesting() {
    // dynamic import to avoid loading the library unless required
    const { Api: CryptoApi } = await import('@proton/crypto/lib/worker/api');
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
