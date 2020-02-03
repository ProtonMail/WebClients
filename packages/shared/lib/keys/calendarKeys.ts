import {
    encryptMessage,
    getMessage,
    getSignature,
    splitMessage,
    decryptMessage,
    createMessage,
    generateKey,
    VERIFICATION_STATUS,
    decryptPrivateKey,
    OpenPGPKey
} from 'pmcrypto';
import getRandomValues from 'get-random-values';
import { c } from 'ttag';

import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from '../constants';
import { normalize } from '../helpers/string';
import { serializeUint8Array } from '../helpers/serialization';
import { Address, EncryptionConfig } from '../interfaces';
import { Key as tsKey, Member } from '../interfaces/calendar';

export enum KeyFlags {
    INACTIVE = 0,
    ACTIVE = 1,
    PRIMARY = 2
}

export const generatePassphrase = () => {
    const value = getRandomValues(new Uint8Array(32));
    return serializeUint8Array(value);
};

/**
 * The calendar key is generated with less user info to not confuse if the key is exported.
 */
export const generateCalendarKey = async ({
    passphrase,
    encryptionConfig
}: {
    passphrase: string;
    encryptionConfig: EncryptionConfig;
}) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Calendar key' }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

export const encryptPassphrase = async ({
    passphrase,
    privateKey,
    memberPublicKeys
}: {
    passphrase: string;
    privateKey: OpenPGPKey;
    memberPublicKeys: { [key: string]: OpenPGPKey };
}) => {
    const memberPublicKeysList = Object.entries(memberPublicKeys);
    const { data, signature } = await encryptMessage({
        message: await createMessage(passphrase),
        publicKeys: memberPublicKeysList.map(([, publicKey]) => publicKey),
        privateKeys: [privateKey],
        detached: true
    });
    const message = await getMessage(data);
    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        keyPackets: memberPublicKeysList.reduce((acc, [memberID], index) => {
            acc[memberID] = serializeUint8Array(asymmetric[index]);
            return acc;
        }, Object.create(null)),
        dataPacket: serializeUint8Array(encrypted[0]),
        signature
    };
};

/**
 * Decrypts a calendar passphrase with a private key
 */
export const decryptPassphrase = async ({
    armoredPassphrase,
    armoredSignature,
    privateKeys,
    publicKeys
}: {
    armoredPassphrase: string;
    armoredSignature: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}) => {
    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message: await getMessage(armoredPassphrase),
        signature: await getSignature(armoredSignature),
        privateKeys,
        publicKeys
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase as string;
};

export const getAddressesMembersMap = (Members: Member[], Addresses: Address[]) => {
    return Members.reduce<{ [key: string]: Address }>((acc, Member) => {
        const Address = Addresses.find(({ Email }) => Email === Member.Email);
        if (!Address) {
            return acc;
        }
        acc[Member.ID] = Address;
        return acc;
    }, {});
};

/**
 * Decrypt the calendar keys.
 * @param Keys - the calendar keys as coming from the API
 * @param passphrasesMap - The decrypted passphrases map
 */
export const decryptCalendarKeys = async (
    Keys: tsKey[],
    passphrasesMap: { [key: string]: string | undefined } = {}
) => {
    const process = async (Key: tsKey) => {
        try {
            const { PrivateKey, PassphraseID } = Key;
            const passphrase = passphrasesMap[PassphraseID] || '';
            const privateKey = await decryptPrivateKey(PrivateKey, passphrase);
            return {
                Key,
                privateKey,
                publicKey: privateKey.toPublic()
            };
        } catch (e) {
            return {
                Key,
                error: e
            };
        }
    };
    return Promise.all(Keys.map(process));
};

/**
 * Convert a map of email -> value to the corresponding member id -> value
 */
export const getKeysMemberMap = <T>(Members: Member[] = [], emailMap: { [key: string]: T } = {}) => {
    return Object.keys(emailMap).reduce<{ [key: string]: T }>((acc, email) => {
        const { ID: memberID } = Members.find(({ Email }) => normalize(Email) === normalize(email)) || {};
        if (!memberID) {
            throw new Error(c('Error').t`Could not find address ${email}.`);
        }
        acc[memberID] = emailMap[email];
        return acc;
    }, {});
};

export const generateCalendarKeyPayload = async ({
    addressID,
    privateKey,
    memberPublicKeys
}: {
    addressID: string;
    privateKey: OpenPGPKey;
    memberPublicKeys: { [key: string]: OpenPGPKey };
}) => {
    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];
    const [
        { privateKeyArmored: PrivateKey },
        { dataPacket: DataPacket, keyPackets: KeyPackets, signature: Signature }
    ] = await Promise.all([
        generateCalendarKey({ passphrase, encryptionConfig }),
        encryptPassphrase({ passphrase, privateKey, memberPublicKeys })
    ]);

    return {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPackets
        }
    };
};
