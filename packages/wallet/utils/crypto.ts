import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import {
    decryptData,
    encryptData,
    generateKey as generateAesGcmKey,
    importKey as importAesGcmKey,
} from '@proton/crypto/lib/subtle/aesGcm';
import { signData as computeHmacSignature, importKey as importHmacKey } from '@proton/crypto/lib/subtle/hmac';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

export enum WalletSignatureContextEnum {
    WALLET_KEY = 'wallet.key',
    BITCOIN_ADDRESS = 'wallet.bitcoin-address',
}

export type WalletSignatureContext = `${WalletSignatureContextEnum}`;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type EncryptedWalletPart = Partial<
    { mnemonic: string; publicKey: undefined } | { mnemonic: undefined; publicKey: string }
>;

export const decryptTextData = async (armoredMessage: string, keys: PrivateKeyReference[]) => {
    // TODO: Implement verification
    const { data } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: keys,
    });

    return { data };
};

type DecryptReturnType<T extends 'binary' | 'utf8'> = T extends 'binary' ? Uint8Array<ArrayBuffer> : string;

export const decryptPgp = async <T extends 'binary' | 'utf8'>(
    armoredMessage: string,
    format: T,
    keys: PrivateKeyReference[]
): Promise<DecryptReturnType<T>> => {
    const { data } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys: keys,
        verificationKeys: keys,
        format,
    });

    return data as DecryptReturnType<T>;
};

const isString = (data: string | Uint8Array): data is string => typeof data === 'string';

export const encryptPgp = async <T extends string | Uint8Array<ArrayBuffer>>(
    data: T,
    keys: PublicKeyReference[],
    signingKeys?: PrivateKeyReference[]
) => {
    const common = {
        encryptionKeys: keys,
        signingKeys,
        format: 'armored',
    } as const;

    let message: string;
    if (isString(data)) {
        message = await CryptoProxy.encryptMessage({
            textData: data,
            ...common,
        }).then(({ message }) => message);
    } else {
        message = await CryptoProxy.encryptMessage({
            binaryData: data as Uint8Array<ArrayBuffer>,
            ...common,
        }).then(({ message }) => message);
    }

    return message;
};

export const encryptTransactionMessage = async (
    message: string,
    encryptionKeys: { email: string; key: PublicKeyReference }[],
    signingKeys?: PrivateKeyReference[]
) => {
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: encryptionKeys.map(({ key }) => key) });

    const { message: encrypted } = await CryptoProxy.encryptMessage({
        textData: message,
        sessionKey,
        signingKeys,
        format: 'binary',
    });

    const emailAndKeys = await Promise.all(
        encryptionKeys.map(async ({ email, key }) => {
            const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: key,
                format: 'binary',
            });

            return { email, key: uint8ArrayToBase64String(encryptedSessionKey) };
        })
    );

    const keyPackets = emailAndKeys.reduce(
        (acc, emailAndKey) => ({ ...acc, [emailAndKey.email]: emailAndKey.key }),
        {}
    );

    return { data_packet: uint8ArrayToBase64String(encrypted), key_packets: keyPackets };
};

export const signData = async <T extends string | Uint8Array<ArrayBuffer>>(
    data: T,
    context: WalletSignatureContext,
    keys: PrivateKeyReference[]
) => {
    const common = {
        signingKeys: keys,
        detached: true,
        format: 'armored',
        signatureContext: { critical: true, value: context },
    } as const;

    let signature;
    if (isString(data)) {
        signature = await CryptoProxy.signMessage({
            textData: data,
            ...common,
        });
    } else {
        signature = await CryptoProxy.signMessage({
            binaryData: data as Uint8Array<ArrayBuffer>,
            ...common,
        });
    }

    return signature;
};

export const verifySignedData = async <T extends string | Uint8Array>(
    data: T,
    signature: string,
    context: WalletSignatureContext,
    keys: (PrivateKeyReference | PublicKeyReference)[]
) => {
    const common = {
        armoredSignature: signature,
        verificationKeys: keys,
        signatureContext: { required: true, value: context },
    } as const;

    if (isString(data)) {
        return CryptoProxy.verifyMessage({
            textData: data,
            ...common,
        }).then(({ verificationStatus }) => verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID);
    } else {
        return CryptoProxy.verifyMessage({
            binaryData: data as Uint8Array<ArrayBuffer>,
            ...common,
        }).then(({ verificationStatus }) => verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID);
    }
};

const decryptArmoredWalletKey = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptPgp(
        walletKey,
        'binary',
        keys.map((k) => k.privateKey)
    );

    const isKeyVerified = await verifySignedData(
        decryptedEntropy,
        walletKeySignature,
        'wallet.key',
        keys.map((k) => k.publicKey)
    );

    if (!isKeyVerified) {
        throw new Error('Key could not be verified');
    }

    return decryptedEntropy;
};

export const decryptWalletKey = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptArmoredWalletKey(walletKey, walletKeySignature, keys);
    return importAesGcmKey(decryptedEntropy);
};

export const decryptWalletKeyForHmac = async (walletKey: string, walletKeySignature: string, keys: DecryptedKey[]) => {
    const decryptedEntropy = await decryptArmoredWalletKey(walletKey, walletKeySignature, keys);
    return importHmacKey(decryptedEntropy);
};

export const hmac = async (hmacKey: CryptoKey, data: string) => {
    return computeHmacSignature(hmacKey, stringToUtf8Array(data));
};

/**
 * Encrypts a wallet's data with provided key
 *
 * @param dataToEncrypt an array containing the data to encrypt with the provided wallet key
 * @param key key to use to encrypt wallet data
 * @returns an array containing the data encrypted
 */
export const encryptWalletDataWithWalletKey = async (dataToEncrypt: string[], key: CryptoKey): Promise<string[]> => {
    const encryptedData = await Promise.all(
        dataToEncrypt.map(async (data) => {
            const binaryData = encoder.encode(data);

            const encryptedMnemonic = await encryptData(key, binaryData);
            return uint8ArrayToBase64String(encryptedMnemonic);
        })
    );

    return encryptedData;
};

/**
 * Encrypts a wallet's data
 *
 * @param dataToEncrypt an array containing the data to encrypt with the generated wallet key
 * @param userKey user key to use to encrypt generated wallet key
 * @returns a tupple containing encrypted data and a nested tupple with the encrypted wallet key, its signature, the decrypted wallet key and the id of the user key used to encrypt the wallet key
 */
export const encryptWalletData = async (
    dataToEncrypt: string[],
    userKey: DecryptedKey
): Promise<[string[], [string, string, CryptoKey, string]]> => {
    const secretEntropy = generateAesGcmKey();
    const key = await importAesGcmKey(secretEntropy);

    const encryptedData = await encryptWalletDataWithWalletKey(dataToEncrypt, key);

    const entropySignature = await signData(secretEntropy, 'wallet.key', [userKey.privateKey]);
    const encryptedEntropy = await encryptPgp(secretEntropy, [userKey.publicKey]);

    return [encryptedData, [encryptedEntropy, entropySignature, key, userKey.ID]];
};

/**
 * Decrypts an array of data using provided wallet key
 *
 * @param dataToDecrypt an array containing wallet's data to decrypt with provided walletKey
 * @param walletKey (a.k.a encrypted entropy) used to encrypt wallet's data
 * @returns an array containing wallet's decrypted wallet
 */
export const decryptWalletData = async (dataToDecrypt: (string | null)[], walletKey: CryptoKey) => {
    const decryptedData = await Promise.all(
        dataToDecrypt.map(async (data) => {
            if (!data) {
                return null;
            }

            try {
                const decodedEncryptedMnemonic = base64StringToUint8Array(data);

                const decryptedBinaryMnemonic = await decryptData(walletKey, decodedEncryptedMnemonic);
                return decoder.decode(decryptedBinaryMnemonic);
            } catch (e) {
                return null;
            }
        })
    );

    return decryptedData;
};

/**
 * Decrypts a mnemonic encrypted with user key
 *
 * @param encryptedMnemonic encrypted mnemonic with user key
 * @param keys used to encrypt mnemonic
 * @returns wallet's mnemonic encrypted with walletKey (a.k.a encrypted entropy)
 */
export const decryptMnemonicWithUserKey = async (encryptedMnemonic: string | null, keys: DecryptedKey[]) => {
    if (encryptedMnemonic === null) {
        return null;
    }
    const { data: decryptedBinaryMnemonic } = await CryptoProxy.decryptMessage({
        binaryMessage: base64StringToUint8Array(encryptedMnemonic),
        decryptionKeys: keys.map((k) => k.privateKey),
        format: 'binary',
    });

    return uint8ArrayToBase64String(decryptedBinaryMnemonic);
};
