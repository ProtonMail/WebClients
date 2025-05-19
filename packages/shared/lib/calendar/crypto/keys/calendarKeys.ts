import { c } from 'ttag';

import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS, toPublicKeyReference } from '@proton/crypto';
import { getSignatureContext } from '@proton/shared/lib/calendar/crypto/helpers';
import isTruthy from '@proton/utils/isTruthy';

import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../../constants';
import { uint8ArrayToBase64String } from '../../../helpers/encoding';
import type { KeyGenConfig, SimpleMap } from '../../../interfaces';
import type {
    CreateOrResetCalendarPayload,
    DecryptedCalendarKey,
    CalendarKey as tsKey,
} from '../../../interfaces/calendar';
import { getEncryptedSessionKey } from '../encrypt';

export const generatePassphrase = () => {
    const value = crypto.getRandomValues(new Uint8Array(32));
    return uint8ArrayToBase64String(value);
};

/**
 * The calendar key is generated with less user info to not confuse if the key is exported.
 */
export const generateCalendarKey = async ({
    passphrase,
    keyGenConfig,
}: {
    passphrase: string;
    keyGenConfig: KeyGenConfig;
}) => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Calendar key' }],
        ...keyGenConfig,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });

    return { privateKey, privateKeyArmored };
};

export const signPassphrase = ({ passphrase, privateKey }: { passphrase: string; privateKey: PrivateKeyReference }) => {
    return CryptoProxy.signMessage({ textData: passphrase, signingKeys: privateKey, detached: true });
};

export const encryptPassphrase = async ({
    passphrase,
    privateKey,
    publicKey,
}: {
    passphrase: string;
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
}): Promise<{
    keyPacket: string;
    dataPacket: string;
    signature: string;
}> => {
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: publicKey });
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData, signature: binarySignature } = await CryptoProxy.encryptMessage({
        textData: passphrase, // stripTrailingSpaces: false
        sessionKey,
        signingKeys: privateKey,
        detached: true,
        format: 'binary',
    });

    // encrypt to the public key separately to get a separate serialized session key
    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
        ...sessionKey,
        encryptionKeys: publicKey,
        format: 'binary',
    });

    return {
        keyPacket: uint8ArrayToBase64String(encryptedSessionKey),
        dataPacket: uint8ArrayToBase64String(encryptedData),
        signature: await CryptoProxy.getArmoredSignature({ binarySignature }),
    };
};

export function encryptPassphraseSessionKey({
    sessionKey,
    publicKey,
    signingKey,
}: {
    sessionKey: SessionKey;
    publicKey: PublicKeyReference;
    signingKey: PrivateKeyReference;
}): Promise<{ encryptedSessionKey: string; armoredSignature: string }>;
export function encryptPassphraseSessionKey({
    sessionKey,
    memberPublicKeys,
    signingKey,
}: {
    sessionKey: SessionKey;
    memberPublicKeys: SimpleMap<PublicKeyReference>;
    signingKey: PrivateKeyReference;
}): Promise<{ encryptedSessionKeyMap: SimpleMap<string>; armoredSignature: string }>;
export function encryptPassphraseSessionKey({
    sessionKey,
    memberPublicKeys,
    signingKey,
}: {
    sessionKey: SessionKey;
    memberPublicKeys: SimpleMap<PublicKeyReference>;
    signingKey: PrivateKeyReference;
}): Promise<{ encryptedSessionKey?: string; encryptedSessionKeyMap?: SimpleMap<string>; armoredSignature: string }>;

export async function encryptPassphraseSessionKey({
    sessionKey,
    publicKey,
    memberPublicKeys,
    signingKey,
}: {
    sessionKey: SessionKey;
    publicKey?: PublicKeyReference;
    memberPublicKeys?: SimpleMap<PublicKeyReference>;
    signingKey: PrivateKeyReference;
}) {
    const armoredSignaturePromise = CryptoProxy.signMessage({
        binaryData: sessionKey.data,
        signingKeys: signingKey,
        detached: true,
        format: 'armored',
        signatureContext: { critical: true, value: getSignatureContext('calendar.sharing.invite') },
    });

    if (publicKey) {
        const [armoredSignature, encryptedSessionKey] = await Promise.all([
            armoredSignaturePromise,
            uint8ArrayToBase64String(await getEncryptedSessionKey(sessionKey, publicKey)),
        ]);

        return {
            encryptedSessionKey,
            armoredSignature,
        };
    } else if (memberPublicKeys) {
        const encryptedSessionKeysPromise = Promise.all(
            Object.entries(memberPublicKeys).map(async ([id, publicKey]) => {
                if (!publicKey) {
                    throw new Error('Missing public key for member');
                }
                const keyPacket = uint8ArrayToBase64String(await getEncryptedSessionKey(sessionKey, publicKey));

                return [id, keyPacket];
            })
        );

        const [armoredSignature, encryptedSessionKeys] = await Promise.all([
            armoredSignaturePromise,
            encryptedSessionKeysPromise,
        ]);

        return {
            encryptedSessionKeyMap: Object.fromEntries(encryptedSessionKeys),
            armoredSignature,
        };
    }

    throw new Error('Missing parameters to encrypt session key');
}

/**
 * Decrypts a calendar passphrase with either some private keys or a session key
 */
export const decryptPassphrase = async ({
    armoredPassphrase,
    sessionKey,
    armoredSignature,
    privateKeys,
    publicKeys,
}: {
    armoredPassphrase: string;
    sessionKey?: SessionKey;
    armoredSignature?: string;
    privateKeys?: PrivateKeyReference[];
    publicKeys?: PublicKeyReference[];
}) => {
    const { data: decryptedPassphrase, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage: armoredPassphrase,
        armoredSignature,
        decryptionKeys: privateKeys,
        verificationKeys: publicKeys,
        sessionKeys: sessionKey,
    });

    if (publicKeys?.length && verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase;
};

/**
 * Retrieves the decrypted session key that encrypts a calendar passphrase with a private key
 */
export const decryptPassphraseSessionKey = ({
    armoredPassphrase,
    privateKeys,
}: {
    armoredPassphrase: string;
    privateKeys: PrivateKeyReference[];
}) => {
    return CryptoProxy.decryptSessionKey({
        armoredMessage: armoredPassphrase,
        decryptionKeys: privateKeys,
    });
};

/**
 * Decrypt the calendar keys.
 * @param Keys - the calendar keys as coming from the API
 * @param passphrasesMap - The decrypted passphrases map
 */
export const getDecryptedCalendarKeys = async (
    Keys: tsKey[],
    passphrasesMap: { [key: string]: string | undefined } = {}
): Promise<DecryptedCalendarKey[]> => {
    const process = async (Key: tsKey) => {
        try {
            const { PrivateKey, PassphraseID } = Key;
            const passphrase = passphrasesMap[PassphraseID] || '';
            const privateKey = await CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase });
            const publicKey = await toPublicKeyReference(privateKey);
            return {
                Key,
                privateKey,
                publicKey,
            };
        } catch (e: any) {
            return undefined;
        }
    };
    return Promise.all(Keys.map(process)).then((result) => {
        return result.filter(isTruthy);
    });
};

export const generateCalendarKeyPayload = async ({
    addressID,
    privateKey,
    publicKey,
}: {
    addressID: string;
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
}): Promise<CreateOrResetCalendarPayload> => {
    const passphrase = generatePassphrase();
    const keyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];
    const [{ privateKeyArmored: PrivateKey }, { dataPacket: DataPacket, keyPacket: KeyPacket, signature: Signature }] =
        await Promise.all([
            generateCalendarKey({ passphrase, keyGenConfig }),
            encryptPassphrase({ passphrase, privateKey, publicKey }),
        ]);

    return {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPacket,
        },
    };
};
