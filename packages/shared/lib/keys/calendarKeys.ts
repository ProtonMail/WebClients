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
    OpenPGPKey,
} from 'pmcrypto';
import getRandomValues from '@proton/get-random-values';
import { c } from 'ttag';

import isTruthy from '@proton/util/isTruthy';
import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from '../constants';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import { Address, EncryptionConfig } from '../interfaces';
import { DecryptedCalendarKey, CalendarKey as tsKey, CalendarMember, CalendarKeyFlags } from '../interfaces/calendar';
import { CalendarSetupData } from '../interfaces/calendar/Api';
import { hasBit } from '../helpers/bitset';

export const generatePassphrase = () => {
    const value = getRandomValues(new Uint8Array(32));
    return uint8ArrayToBase64String(value);
};

export const getPrimaryCalendarKey = (calendarKeys: DecryptedCalendarKey[]) => {
    const primaryKey = calendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, CalendarKeyFlags.PRIMARY));
    if (!primaryKey) {
        throw new Error('Calendar primary key not found');
    }
    return primaryKey;
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
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Calendar key' }],
        passphrase,
        ...encryptionConfig,
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

export const encryptPassphrase = async ({
    passphrase,
    privateKey,
    publicKey,
    memberPublicKeys,
}: {
    passphrase: string;
    privateKey: OpenPGPKey;
    /**
     * Used after calendar creation
     * Pass either this or memberPublicKeys
     */
    publicKey?: OpenPGPKey;
    /**
     * Used for calendar reset
     * Pass either this or publicKey
     */
    memberPublicKeys?: { [key: string]: OpenPGPKey };
}) => {
    const memberPublicKeysList = memberPublicKeys ? Object.entries(memberPublicKeys) : null;
    const { data, signature } = await encryptMessage({
        message: await createMessage(passphrase),
        publicKeys: memberPublicKeysList?.map(([, publicKey]) => publicKey) || [publicKey],
        privateKeys: [privateKey],
        detached: true,
    });
    const message = await getMessage(data);
    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        keyPackets: !publicKey
            ? memberPublicKeysList?.reduce((acc, [memberID], index) => {
                  acc[memberID] = uint8ArrayToBase64String(asymmetric[index]);
                  return acc;
              }, Object.create(null))
            : null,
        keyPacket: publicKey ? uint8ArrayToBase64String(asymmetric[0]) : null,
        dataPacket: uint8ArrayToBase64String(encrypted[0]),
        signature,
    };
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
    armoredSignature: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}) => {
    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message: await getMessage(armoredPassphrase),
        signature: await getSignature(armoredSignature),
        privateKeys,
        publicKeys,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase as string;
};

export const getAddressesMembersMap = (Members: CalendarMember[], Addresses: Address[]) => {
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
export const getDecryptedCalendarKeys = async (
    Keys: tsKey[],
    passphrasesMap: { [key: string]: string | undefined } = {}
): Promise<DecryptedCalendarKey[]> => {
    const process = async (Key: tsKey) => {
        try {
            const { PrivateKey, PassphraseID } = Key;
            const passphrase = passphrasesMap[PassphraseID] || '';
            const privateKey = await decryptPrivateKey(PrivateKey, passphrase);
            return {
                Key,
                privateKey,
                publicKey: privateKey.toPublic(),
            };
        } catch (e: any) {
            return undefined;
        }
    };
    return Promise.all(Keys.map(process)).then((result) => {
        return result.filter(isTruthy);
    });
};

export const isCalendarSetupData = (
    payload: GenerateCalendarPayload | CalendarSetupData
): payload is CalendarSetupData => isTruthy(payload.Passphrase.KeyPacket);

interface GenerateCalendarPayload {
    AddressID: string;
    Signature: string;
    PrivateKey: string;
    Passphrase: {
        DataPacket: string;
        KeyPacket?: string;
        KeyPackets?: string;
    };
}

export const generateCalendarKeyPayload = async ({
    addressID,
    privateKey,
    publicKey,
    memberPublicKeys,
}: {
    addressID: string;
    privateKey: OpenPGPKey;
    /**
     * Used after calendar creation
     * Pass either this or memberPublicKeys
     */
    publicKey?: OpenPGPKey;
    /**
     * Used for calendar reset
     * Pass either this or publicKey
     */
    memberPublicKeys?: { [key: string]: OpenPGPKey };
}): Promise<GenerateCalendarPayload | CalendarSetupData> => {
    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519];
    const [{ privateKeyArmored: PrivateKey }, { dataPacket: DataPacket, keyPackets, keyPacket, signature: Signature }] =
        await Promise.all([
            generateCalendarKey({ passphrase, encryptionConfig }),
            encryptPassphrase({ passphrase, privateKey, publicKey, memberPublicKeys }),
        ]);

    const payload: GenerateCalendarPayload = {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
        },
    };

    if (keyPackets) {
        payload.Passphrase.KeyPackets = keyPackets;
    } else if (keyPacket) {
        payload.Passphrase.KeyPacket = keyPacket;
    } else {
        throw new Error('Missing key packet');
    }

    return payload;
};
