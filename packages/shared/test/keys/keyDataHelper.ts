import type { PrivateKeyReference, PrivateKeyReferenceV4 } from '@proton/crypto';
import { CryptoProxy, toPublicKeyReference } from '@proton/crypto';

import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../lib/constants';
import type { Key, KeyGenConfig, KeyGenConfigV6 } from '../../lib/interfaces';
import { generateAddressKey, generateAddressKeyTokens, generateUserKey } from '../../lib/keys';

const defaultKeyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];

export const getUserKey = async (
    ID: string,
    keyPassword: string,
    version = 3,
    keyGenConfig: KeyGenConfig | KeyGenConfigV6 = defaultKeyGenConfig
) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase: keyPassword,
        keyGenConfig,
    });
    return {
        key: {
            ID,
            privateKey,
            publicKey: await toPublicKeyReference(privateKey),
        },
        Key: {
            ID,
            PrivateKey: privateKeyArmored,
            Version: version,
        } as Key,
    };
};

export const getAddressKeyHelper = async <V extends PrivateKeyReference>(
    ID: string,
    userKey: PrivateKeyReference,
    privateKey: V,
    primary: boolean = false,
    version = 3
) => {
    const result = await generateAddressKeyTokens(userKey);
    const privateKeyArmored = await CryptoProxy.exportPrivateKey({
        privateKey,
        passphrase: result.token,
    });
    return {
        key: {
            ID,
            privateKey,
            publicKey: await toPublicKeyReference(privateKey),
        },
        Key: {
            ID,
            PrivateKey: privateKeyArmored,
            Signature: result.signature,
            Token: result.encryptedToken,
            Version: version,
            Flags: 3,
            Primary: primary ? 1 : 0,
        } as Key,
    };
};

export const getAddressKey = async <C extends KeyGenConfig | KeyGenConfigV6 = KeyGenConfig>(
    ID: string,
    userKey: PrivateKeyReference,
    email: string,
    primary: boolean = false,
    version?: number,
    keyGenConfig: C = defaultKeyGenConfig as C
) => {
    const key = await generateAddressKey<C>({
        email,
        passphrase: 'tmp',
        keyGenConfig,
    });
    return getAddressKeyHelper(ID, userKey, key.privateKey, primary, version);
};

export const getAddressKeyForE2EEForwarding = async (
    ID: string,
    userKey: PrivateKeyReference,
    email: string,
    primary: boolean = false,
    version?: number
) => {
    const forwarderKey = await CryptoProxy.generateKey({
        userIDs: { email: 'forwarder@test.com' },
    });
    const { forwardeeKey: armoredKey } = await CryptoProxy.generateE2EEForwardingMaterial({
        forwarderKey,
        userIDsForForwardeeKey: { email },
        passphrase: '123',
    });
    const forwardeeKey = (await CryptoProxy.importPrivateKey({
        armoredKey,
        passphrase: '123',
    })) as PrivateKeyReferenceV4;
    return getAddressKeyHelper(ID, userKey, forwardeeKey, primary, version);
};

/**
 * Sign-only address keys cannot be primary, and cannot currently be imported from the web-client,
 * but are supported by the BE, hence they may be present for some users.
 */
export const getAddressKeySignOnly = async (
    ID: string,
    userKey: PrivateKeyReference,
    email: string,
    version?: number
) => {
    const signOnlyKey = await CryptoProxy.generateKey({
        userIDs: { email },
        subkeys: [],
    });
    return getAddressKeyHelper(ID, userKey, signOnlyKey, false, version);
};

export const getLegacyAddressKey = async (ID: string, password: string, email: string) => {
    const key = await generateAddressKey({
        email,
        passphrase: password,
        keyGenConfig: defaultKeyGenConfig,
    });
    return {
        key: {
            ID,
            privateKey: key.privateKey,
            publicKey: await toPublicKeyReference(key.privateKey),
        },
        Key: {
            ID,
            PrivateKey: key.privateKeyArmored,
            Version: 3,
        } as Key,
    };
};
