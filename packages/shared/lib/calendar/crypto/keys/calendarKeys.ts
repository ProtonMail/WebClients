import { c } from 'ttag';

import {
    CryptoProxy,
    PrivateKeyReference,
    PublicKeyReference,
    SessionKey,
    VERIFICATION_STATUS,
    toPublicKeyReference,
} from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';

import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../../../constants';
import { uint8ArrayToBase64String } from '../../../helpers/encoding';
import { EncryptionConfig, SimpleMap } from '../../../interfaces';
import { CreateOrResetCalendarPayload, DecryptedCalendarKey, CalendarKey as tsKey } from '../../../interfaces/calendar';
import { CalendarSetupData } from '../../../interfaces/calendar/Api';
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
    encryptionConfig,
}: {
    passphrase: string;
    encryptionConfig: EncryptionConfig;
}) => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Calendar key' }],
        ...encryptionConfig,
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

    // encrypt to each public key separetely to get separate serialized session keys
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

export const encryptPassphraseSessionKey = async ({
    sessionKey,
    memberPublicKeys,
}: {
    sessionKey: SessionKey;
    memberPublicKeys: SimpleMap<PublicKeyReference>;
}): Promise<SimpleMap<string>> => {
    const encryptedSessionKeys = await Promise.all(
        Object.entries(memberPublicKeys).map(async ([id, publicKey]) => {
            if (!publicKey) {
                throw new Error('Missing public key for member');
            }
            const keyPacket = uint8ArrayToBase64String(await getEncryptedSessionKey(sessionKey, publicKey));

            return [id, keyPacket];
        })
    );

    return Object.fromEntries(encryptedSessionKeys);
};

/**
 * Decrypts a calendar passphrase with a private key
 */
export const decryptPassphrase = async ({
    armoredPassphrase,
    armoredSignature,
    privateKeys,
    publicKeys,
}: {
    armoredPassphrase: string;
    armoredSignature?: string;
    privateKeys: PrivateKeyReference[];
    publicKeys?: PublicKeyReference[];
}) => {
    const { data: decryptedPassphrase, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: armoredPassphrase,
        armoredSignature,
        decryptionKeys: privateKeys,
        verificationKeys: publicKeys,
    });

    if (publicKeys?.length && verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase as string;
};

/**
 * Retrieves the decrypted session key that encrypts a calendar passphrase with a private key
 */
export const decryptPassphraseSessionKey = async ({
    armoredPassphrase,
    privateKeys,
}: {
    armoredPassphrase: string;
    privateKeys: PrivateKeyReference[];
}) => {
    const sessionKey = await CryptoProxy.decryptSessionKey({
        armoredMessage: armoredPassphrase,
        decryptionKeys: privateKeys,
    });

    return sessionKey;
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
}): Promise<CreateOrResetCalendarPayload | CalendarSetupData> => {
    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519];
    const [{ privateKeyArmored: PrivateKey }, { dataPacket: DataPacket, keyPacket: KeyPacket, signature: Signature }] =
        await Promise.all([
            generateCalendarKey({ passphrase, encryptionConfig }),
            encryptPassphrase({ passphrase, privateKey, publicKey }),
        ]);

    const payload: CreateOrResetCalendarPayload = {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPacket,
        },
    };

    return payload;
};
