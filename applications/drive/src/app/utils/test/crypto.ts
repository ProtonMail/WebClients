import * as openpgp from 'openpgp';
import { init } from 'pmcrypto/lib/pmcrypto';
import { getKeys, generateSessionKey as realGenerateSessionKey, OpenPGPKey, SessionKey } from 'pmcrypto';

init(openpgp);

export async function generatePrivateKey(name = 'name', email = 'name@example.com'): Promise<OpenPGPKey> {
    const { privateKeys } = await generateKeys(name, email);
    if (privateKeys.length !== 1) {
        throw new Error('Private key was not generated');
    }
    return privateKeys[0];
}

export async function generateKeys(name = 'name', email = 'name@example.com') {
    const { publicKeyArmored, privateKeyArmored } = await openpgp.generateKey({
        userIds: [{ name, email }],
    });
    const publicKeys = await getKeys(publicKeyArmored);
    const privateKeys = await getKeys(privateKeyArmored);

    return {
        name,
        email,
        publicKeyArmored,
        privateKeyArmored,
        publicKeys,
        privateKeys,
    };
}

export async function generateSessionKey(algorithm = 'aes256'): Promise<SessionKey> {
    return {
        data: await realGenerateSessionKey(algorithm),
        algorithm,
    };
}
