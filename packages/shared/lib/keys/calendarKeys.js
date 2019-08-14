import {
    encryptMessage,
    getMessage,
    getSignature,
    splitMessage,
    encodeBase64,
    arrayToBinaryString,
    decryptMessage,
    getKeys,
    createMessage,
    generateKey
} from 'pmcrypto';
import getRandomValues from 'get-random-values';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import { c } from 'ttag';

import { noop } from '../helpers/function';
import { uniqueBy } from '../helpers/array';
import { getPrimaryKey } from './keys';

/**
 * @return {String}
 */
export const generatePassphrase = () => {
    const value = getRandomValues(new Uint8Array(32));
    return encodeBase64(arrayToBinaryString(value));
};

/**
 * The calendar key is generated with less user info to not confuse if the key is exported.
 * @param {String} passphrase
 * @param {Object} encryptionConfig
 * @returns {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateCalendarKey = async ({ passphrase, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'Calendar key' }],
        passphrase,
        ...encryptionConfig
    });

    await privateKey.decrypt(passphrase);

    return { privateKey, privateKeyArmored };
};

/**
 * @param {String} passphrase
 * @param {Object} privateKey
 * @param {Object} memberPublicKeys
 * @returns {Promise<{keyPackets, dataPacket, signature}>}
 */
export const encryptPassphrase = async ({ passphrase, privateKey, memberPublicKeys }) => {
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
            acc[memberID] = encodeBase64(arrayToBinaryString(asymmetric[index]));
            return acc;
        }, Object.create(null)),
        dataPacket: encodeBase64(arrayToBinaryString(encrypted[0])),
        signature
    };
};

/**
 * Finds the member and the decrypted primary key of the address belonging to the user of the calendar in the list of members.
 * @param {Array} calendarMembers - The members of the calendar
 * @param {Array} addresses - The addresses belonging to the user
 * @param {Object} addressesKeysMap - The decrypted keys map belonging to the addresses
 * @return {{primaryKey, member}}
 */
export const findPrimaryAddressKey = ({ calendarMembers = [], addresses = [], addressesKeysMap = {} }) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const member of calendarMembers) {
        const address =
            addresses.find(({ Email: AddressEmail }) => {
                return member.Email === AddressEmail;
            }) || {};
        const addressKeys = addressesKeysMap[address.ID];
        const { privateKey } = getPrimaryKey(addressKeys) || {};

        if (!privateKey || !privateKey.isDecrypted()) {
            continue;
        }

        return {
            member,
            primaryKey: privateKey
        };
    }
};

/**
 * Decrypts a calendar passphrase with a private key
 * @param {String} armoredPassphrase
 * @param {String} armoredSignature
 * @param {Object} privateKey decrypted private key
 * @param {String} publicKey
 * @return {String} - the decrypted passphrase
 */
export const decryptPassphrase = async ({ armoredPassphrase, armoredSignature, privateKey, publicKey }) => {
    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message: await getMessage(armoredPassphrase),
        signature: await getSignature(armoredSignature),
        privateKeys: [privateKey],
        publicKeys: [publicKey]
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`'Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedPassphrase;
};

/**
 * Decrypt all passphrases for a given member and its primary key.
 * Verifies the signature against the same key.
 * @param {Array} passphrases
 * @param {String} memberID
 * @param {Object} primaryKey
 * @return {Promise}
 */
export const decryptPassphrases = async (passphrases, memberID, primaryKey) => {
    const publicKey = primaryKey.toPublic();

    const decryptedPassphrases = await Promise.all(
        passphrases.map(({ MemberPassphrases }) => {
            const { Passphrase: armoredPassphrase, Signature: armoredSignature } =
                MemberPassphrases.find(({ MemberID: otherMemberID }) => otherMemberID === memberID) || {};

            return decryptPassphrase({
                armoredPassphrase,
                armoredSignature,
                privateKey: primaryKey,
                publicKey
            }).catch(noop);
        })
    );
    return passphrases.reduce(
        (acc, { ID }, i) => ({
            ...acc,
            [ID]: decryptedPassphrases[i]
        }),
        {}
    );
};

/**
 * Decrypt the calendar keys for a given member.
 * @param {Array} calendarKeys - the calendar keys as coming from the API
 * @param {Array} calendarPassphrases - the calendar passphrases as coming from the API
 * @param {Object} calendarMember - the calendar member as coming from the API
 * @param {PGPKey} primaryKey - the decrypted primary key of the member
 * @return {Promise}
 */
export const decryptCalendarKeys = async ({
    calendarKeys = [],
    calendarPassphrases = [],
    calendarMember,
    primaryKey
}) => {
    // Get all the passphrases that exist in the calendar keys
    const requiredPassphrases = uniqueBy(calendarKeys, ({ PassphraseID }) => PassphraseID).map(({ PassphraseID }) => {
        return calendarPassphrases.find(({ ID }) => ID === PassphraseID);
    });
    const decryptedPassphrasesMap = await decryptPassphrases(requiredPassphrases, calendarMember.ID, primaryKey);

    return Promise.all(
        calendarKeys.map(async (Key) => {
            const { PrivateKey, PassphraseID } = Key;
            const decryptedPassphrase = decryptedPassphrasesMap[PassphraseID];

            const [privateKey] = await getKeys(PrivateKey);
            await privateKey.decrypt(decryptedPassphrase).catch(noop);

            return {
                Key,
                privateKey
            };
        })
    );
};
