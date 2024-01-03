import { c } from 'ttag';

import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS, serverTime } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import isTruthy from '@proton/utils/isTruthy';

import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import {
    Address,
    AddressKey,
    DecryptedAddressKey,
    DecryptedKey,
    EncryptionConfig,
    KeyPair,
    KeysPair,
    AddressKey as tsAddressKey,
} from '../interfaces';
import { decryptMemberToken } from './memberToken';

interface EncryptAddressKeyTokenArguments {
    token: string;
    userKey: PrivateKeyReference;
    organizationKey?: PrivateKeyReference;
}

export const encryptAddressKeyToken = async ({ token, userKey, organizationKey }: EncryptAddressKeyTokenArguments) => {
    const date = serverTime(); // ensure the signed message and the encrypted one have the same creation time, otherwise verification will fail
    const textData = token;
    const [userSignatureResult, organizationSignatureResult] = await Promise.all([
        CryptoProxy.signMessage({
            textData, // stripTrailingSpaces: false,
            date,
            signingKeys: [userKey],
            detached: true,
        }),
        organizationKey
            ? CryptoProxy.signMessage({
                  textData, // stripTrailingSpaces: false,
                  date,
                  signingKeys: [organizationKey],
                  detached: true,
              })
            : undefined,
    ]);

    const { message: encryptedToken } = await CryptoProxy.encryptMessage({
        textData,
        date,
        encryptionKeys: organizationKey ? [userKey, organizationKey] : [userKey],
    });

    return {
        token,
        encryptedToken,
        signature: userSignatureResult,
        ...(organizationSignatureResult && { organizationSignature: organizationSignatureResult }),
    };
};

interface DecryptAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    privateKeys: PrivateKeyReference | PrivateKeyReference[];
    publicKeys: PublicKeyReference | PublicKeyReference[];
}

export const decryptAddressKeyToken = async ({
    Token,
    Signature,
    privateKeys,
    publicKeys,
}: DecryptAddressKeyTokenArguments) => {
    const { data: decryptedToken, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: Token,
        armoredSignature: Signature,
        decryptionKeys: privateKeys,
        verificationKeys: publicKeys,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

interface AddressKeyTokenResult {
    token: string;
    encryptedToken: string;
    signature: string;
    organizationSignature?: string;
}

interface AddressKeyOrgTokenResult extends AddressKeyTokenResult {
    organizationSignature: string;
}

export function generateAddressKeyTokens(
    userKey: PrivateKeyReference,
    organizationKey: PrivateKeyReference
): Promise<AddressKeyOrgTokenResult>;
export function generateAddressKeyTokens(
    userKey: PrivateKeyReference,
    organizationKey?: PrivateKeyReference
): Promise<AddressKeyTokenResult>;

export async function generateAddressKeyTokens(userKey: PrivateKeyReference, organizationKey?: PrivateKeyReference) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = arrayToHexString(randomBytes);
    return encryptAddressKeyToken({ token, organizationKey, userKey });
}

interface GetAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    organizationKey?: KeyPair;
    privateKeys: PrivateKeyReference | PrivateKeyReference[];
    publicKeys: PublicKeyReference | PublicKeyReference[];
}

export const getAddressKeyToken = ({
    Token,
    Signature,
    organizationKey,
    privateKeys,
    publicKeys,
}: GetAddressKeyTokenArguments) => {
    // New address key format
    if (Signature) {
        return decryptAddressKeyToken({
            Token,
            Signature,
            privateKeys,
            publicKeys,
        });
    }
    if (!organizationKey) {
        throw new Error('Missing organization key');
    }
    // Old address key format for an admin signed into a non-private user
    return decryptMemberToken(Token, [organizationKey.privateKey], [organizationKey.publicKey]);
};

export const getAddressKeyPassword = (
    { Activation, Token, Signature }: tsAddressKey,
    userKeys: KeysPair,
    keyPassword: string,
    organizationKey?: KeyPair
) => {
    // If not decrypting the non-private member keys with the organization key, and
    // because the activation process is asynchronous in the background, allow the
    // private key to get decrypted already here so that it can be used
    if (!organizationKey && Activation) {
        return decryptMemberToken(Activation, userKeys.privateKeys, userKeys.publicKeys);
    }

    if (Token) {
        return getAddressKeyToken({
            Token,
            Signature,
            organizationKey,
            privateKeys: userKeys.privateKeys,
            publicKeys: userKeys.publicKeys,
        });
    }

    return Promise.resolve(keyPassword);
};

export const getDecryptedAddressKey = async (
    { ID, PrivateKey, Flags, Primary }: tsAddressKey,
    addressKeyPassword: string
): Promise<DecryptedAddressKey> => {
    const privateKey = await CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: addressKeyPassword });
    const publicKey = await CryptoProxy.importPublicKey({
        binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
    });
    return {
        ID,
        Flags,
        privateKey,
        publicKey,
        Primary,
    };
};

export interface ReformatAddressKeyArguments {
    email: string;
    name?: string;
    passphrase: string;
    privateKey: PrivateKeyReference;
}

export const reformatAddressKey = async ({
    email,
    name = email,
    passphrase,
    privateKey: originalKey,
}: ReformatAddressKeyArguments) => {
    const privateKey = await CryptoProxy.reformatKey({
        userIDs: [{ name, email }],
        privateKey: originalKey,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });

    return { privateKey, privateKeyArmored };
};

export const getEncryptedArmoredAddressKey = async (
    privateKey: PrivateKeyReference,
    email: string,
    newKeyPassword: string
) => {
    return CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: newKeyPassword });
};

export interface GenerateAddressKeyArguments {
    email: string;
    name?: string;
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
}

export const generateAddressKey = async ({
    email,
    name = email,
    passphrase,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
}: GenerateAddressKeyArguments) => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name, email }],
        ...encryptionConfig,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });

    return { privateKey, privateKeyArmored };
};

export const getIsTokenEncryptedToKeys = async ({
    addressKey,
    decryptionKeys,
}: {
    addressKey: AddressKey;
    decryptionKeys: PrivateKeyReference[];
}) => {
    try {
        const sessionKey = await CryptoProxy.decryptSessionKey({
            armoredMessage: addressKey.Token,
            decryptionKeys,
        });
        return !!sessionKey;
    } catch (e) {
        return false;
    }
};

interface ReplaceAddressTokens {
    privateKey: PrivateKeyReference;
    userKeys: DecryptedKey[];
    addresses: Address[];
}

const replaceAddressKeyToken = async ({
    addressKey,
    decryptionKeys,
    encryptionKey,
}: {
    addressKey: AddressKey;
    decryptionKeys: PrivateKeyReference[];
    encryptionKey: PrivateKeyReference;
}) => {
    const sessionKey = await CryptoProxy.decryptSessionKey({
        armoredMessage: addressKey.Token,
        decryptionKeys,
    });

    if (!sessionKey) {
        return undefined;
    }

    const message = await CryptoProxy.decryptMessage({
        armoredMessage: addressKey.Token,
        sessionKeys: sessionKey,
        format: 'binary',
    });

    const result = await CryptoProxy.encryptSessionKey({
        ...sessionKey,
        encryptionKeys: [encryptionKey],
        format: 'binary',
    });

    const signature = await CryptoProxy.signMessage({
        binaryData: message.data,
        signingKeys: [encryptionKey],
        detached: true,
    });

    return {
        id: addressKey.ID,
        keyPacket: uint8ArrayToBase64String(result),
        signature,
    };
};

export const getReplacedAddressKeyTokens = async ({ addresses, userKeys, privateKey }: ReplaceAddressTokens) => {
    const { privateKeys } = splitKeys(userKeys);
    const reEncryptedTokens = await Promise.all(
        addresses.map(async (address) => {
            const result = await Promise.all(
                address.Keys.map(async (addressKey) => {
                    try {
                        // If the address key token is already encrypted to the new key, let's ignore this action.
                        if (await getIsTokenEncryptedToKeys({ addressKey, decryptionKeys: [privateKey] })) {
                            return undefined;
                        }
                        const result = await replaceAddressKeyToken({
                            addressKey,
                            encryptionKey: privateKey,
                            decryptionKeys: privateKeys,
                        });
                        if (!result) {
                            return undefined;
                        }
                        return {
                            AddressKeyID: result.id,
                            KeyPacket: result.keyPacket,
                            Signature: result.signature,
                        };
                    } catch (e) {
                        return undefined;
                    }
                })
            );
            return result.filter(isTruthy);
        })
    );

    return {
        AddressKeyTokens: reEncryptedTokens.flat(),
    };
};

interface RenameAddressKeysArguments {
    userKeys: DecryptedKey[];
    addressKeys: AddressKey[];
    organizationKey?: KeyPair;
    email: string;
}

export const getRenamedAddressKeys = async ({
    userKeys,
    addressKeys,
    organizationKey,
    email,
}: RenameAddressKeysArguments) => {
    const splittedUserKeys = splitKeys(userKeys);

    const cb = async (addressKey: AddressKey) => {
        try {
            const addressKeyPassword = await getAddressKeyPassword(
                addressKey,
                splittedUserKeys,
                '', // Not using a key password since this function only works for address key migrated users
                organizationKey
            );
            const { privateKey } = await getDecryptedAddressKey(addressKey, addressKeyPassword);
            const changedPrivateKey = await CryptoProxy.cloneKeyAndChangeUserIDs({
                privateKey,
                userIDs: [{ name: email, email }],
            });
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey: changedPrivateKey,
                passphrase: addressKeyPassword,
            });
            await CryptoProxy.clearKey({ key: privateKey });
            return {
                PrivateKey: privateKeyArmored,
                ID: addressKey.ID,
            };
        } catch (e) {
            return;
        }
    };

    const result = await Promise.all(addressKeys.map(cb));
    return result.filter(isTruthy);
};

export const getPreviousAddressKeyToken = async ({
    addressKey,
    privateKeys,
    publicKeys,
}: {
    addressKey: AddressKey;
    privateKeys: PrivateKeyReference | PrivateKeyReference[];
    publicKeys: PublicKeyReference | PublicKeyReference[];
}) => {
    const encryptedToken = addressKey.Token;
    if (!encryptedToken) {
        throw new Error('Missing token');
    }
    const signature = addressKey.Signature;
    const token = await getAddressKeyToken({
        Token: encryptedToken,
        Signature: signature,
        privateKeys,
        publicKeys,
    });
    return { signature, token, encryptedToken };
};

export const getNewAddressKeyToken = async ({ address, userKeys }: { address: Address; userKeys: KeyPair[] }) => {
    const userPrimaryKey = getPrimaryKey(userKeys);
    const userKey = userPrimaryKey?.privateKey;
    const splitUserKeys = splitKeys(userKeys);
    if (!userKey) {
        throw new Error('Missing primary user key');
    }
    if (!address.Keys?.length) {
        return generateAddressKeyTokens(userKey);
    }
    // When a primary key is available, we prefer re-using the existing token instead of generating a new one.
    // For non-private members we can generate a new key without requiring access to the org key
    // For future shared addresses, reusing the token will ensure other users can decrypt the new key as well
    const [primaryAddressKey] = address.Keys;
    try {
        return await getPreviousAddressKeyToken({
            addressKey: primaryAddressKey,
            privateKeys: splitUserKeys.privateKeys,
            publicKeys: splitUserKeys.publicKeys,
        });
    } catch {
        return generateAddressKeyTokens(userKey);
    }
};
