import { c } from 'ttag';
import getRandomValues from 'get-random-values';
import {
    arrayToHexString,
    createMessage,
    decryptMessage,
    encryptMessage,
    encryptPrivateKey,
    generateKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    reformatKey,
    signMessage,
    VERIFICATION_STATUS,
} from 'pmcrypto';
import { decryptMemberToken } from './memberToken';
import { EncryptionConfig } from '../interfaces';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';

interface EncryptAddressKeyTokenArguments {
    token: string;
    userKey: OpenPGPKey;
    organizationKey?: OpenPGPKey;
}

export const encryptAddressKeyToken = async ({ token, userKey, organizationKey }: EncryptAddressKeyTokenArguments) => {
    const message = createMessage(token);
    const [userSignatureResult, organizationSignatureResult] = await Promise.all([
        signMessage({
            message,
            privateKeys: [userKey],
            detached: true,
        }),
        organizationKey
            ? signMessage({
                  message,
                  privateKeys: [organizationKey],
                  detached: true,
              })
            : undefined,
    ]);

    const { data: encryptedToken } = await encryptMessage({
        message,
        publicKeys: organizationKey ? [userKey.toPublic(), organizationKey.toPublic()] : [userKey.toPublic()],
    });

    return {
        token,
        encryptedToken,
        signature: userSignatureResult.signature,
        ...(organizationSignatureResult?.signature && { organizationSignature: organizationSignatureResult.signature }),
    };
};

interface DecryptAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    privateKeys: OpenPGPKey | OpenPGPKey[];
    publicKeys: OpenPGPKey | OpenPGPKey[];
}

export const decryptAddressKeyToken = async ({
    Token,
    Signature,
    privateKeys,
    publicKeys,
}: DecryptAddressKeyTokenArguments) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(Token),
        signature: await getSignature(Signature),
        privateKeys,
        publicKeys,
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
}

export function generateAddressKeyTokens(userKey: OpenPGPKey): Promise<AddressKeyTokenResult>;
export function generateAddressKeyTokens(
    userKey: OpenPGPKey,
    organizationKey: OpenPGPKey
): Promise<AddressKeyTokenResult & { organizationSignature: string }>;

export async function generateAddressKeyTokens(userKey: OpenPGPKey, organizationKey?: OpenPGPKey) {
    const randomBytes = getRandomValues(new Uint8Array(32));
    const token = arrayToHexString(randomBytes);
    return encryptAddressKeyToken({ token, organizationKey, userKey });
}

interface GetAddressKeyTokenArguments {
    Token: string;
    Signature: string;
    organizationKey?: OpenPGPKey;
    privateKeys: OpenPGPKey | OpenPGPKey[];
    publicKeys: OpenPGPKey | OpenPGPKey[];
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
            // Verify against the organization key in case an admin is signed in to a non-private member.
            publicKeys: organizationKey ? [organizationKey.toPublic()] : publicKeys,
        });
    }
    if (!organizationKey) {
        throw new Error('Missing organization key');
    }
    // Old address key format for an admin signed into a non-private user
    return decryptMemberToken(Token, organizationKey);
};

interface ReformatAddressKeyArguments {
    email: string;
    name?: string;
    passphrase: string;
    privateKey: OpenPGPKey;
}

export const reformatAddressKey = async ({
    email,
    name = email,
    passphrase,
    privateKey: originalKey,
}: ReformatAddressKeyArguments) => {
    const { key: privateKey, privateKeyArmored } = await reformatKey({
        userIds: [{ name, email }],
        passphrase,
        privateKey: originalKey,
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};
export const getEncryptedArmoredAddressKey = async (
    privateKey: OpenPGPKey | undefined,
    email: string,
    newKeyPassword: string
) => {
    if (!privateKey?.isDecrypted?.()) {
        return;
    }

    const userIds = privateKey.users;
    const primaryUserId = userIds?.[0]?.userId?.userid;

    if (userIds?.length !== 1 || !`${primaryUserId}`.endsWith(`<${email}>`)) {
        const { privateKeyArmored } = await reformatAddressKey({ email, passphrase: newKeyPassword, privateKey });
        return privateKeyArmored;
    }

    return encryptPrivateKey(privateKey, newKeyPassword);
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
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name, email }],
        passphrase,
        ...encryptionConfig,
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};
