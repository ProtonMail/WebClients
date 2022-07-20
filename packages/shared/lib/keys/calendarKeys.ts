import getRandomValues from '@proton/get-random-values';
import { c } from 'ttag';
import {
    CryptoProxy,
    PrivateKeyReference,
    PublicKeyReference,
    toPublicKeyReference,
    VERIFICATION_STATUS,
} from '@proton/crypto';

import isTruthy from '@proton/utils/isTruthy';
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
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Calendar key' }],
        ...encryptionConfig,
    });

    const privateKeyArmored = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase });

    return { privateKey, privateKeyArmored };
};

export const encryptPassphrase = async ({
    passphrase,
    privateKey,
    publicKey,
    memberPublicKeys,
}: {
    passphrase: string;
    privateKey: PrivateKeyReference;
    /**
     * Used after calendar creation
     * Pass either this or memberPublicKeys
     */
    publicKey?: PublicKeyReference;
    /**
     * Used for calendar reset
     * Pass either this or publicKey
     */
    memberPublicKeys?: { [key: string]: PublicKeyReference };
}) => {
    const memberPublicKeysList = memberPublicKeys ? Object.entries(memberPublicKeys) : null;
    const maybePublicKeys = memberPublicKeysList?.map(([, publicKey]) => publicKey) || [publicKey];
    const publicKeys = maybePublicKeys.filter(isTruthy);

    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: publicKeys });
    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData, signature: binarySignature } = await CryptoProxy.encryptMessage({
        textData: passphrase, // stripTrailingSpaces: false
        sessionKey,
        signingKeys: [privateKey],
        detached: true,
        format: 'binary',
    });

    // encrypt to each public key separetely to get separate serialized session keys
    const encryptedSessionKeys = await Promise.all(
        publicKeys.map((publicKey) =>
            CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: publicKey,
                format: 'binary',
            })
        )
    );

    return {
        keyPackets: !publicKey
            ? memberPublicKeysList?.reduce((acc, [memberID], index) => {
                  acc[memberID] = uint8ArrayToBase64String(encryptedSessionKeys[index]);
                  return acc;
              }, Object.create(null))
            : null,
        keyPacket: publicKey ? uint8ArrayToBase64String(encryptedSessionKeys[0]) : null,
        dataPacket: uint8ArrayToBase64String(encryptedData),
        signature: await CryptoProxy.getArmoredSignature({ binarySignature }),
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
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
}) => {
    const { data: decryptedPassphrase, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: armoredPassphrase,
        armoredSignature,
        decryptionKeys: privateKeys,
        verificationKeys: publicKeys,
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
    privateKey: PrivateKeyReference;
    /**
     * Used after calendar creation
     * Pass either this or memberPublicKeys
     */
    publicKey?: PublicKeyReference;
    /**
     * Used for calendar reset
     * Pass either this or publicKey
     */
    memberPublicKeys?: { [key: string]: PublicKeyReference };
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
