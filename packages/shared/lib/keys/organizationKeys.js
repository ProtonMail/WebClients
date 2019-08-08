import {
    arrayToBinaryString,
    decryptMessage,
    encodeBase64,
    encryptMessage,
    encryptPrivateKey,
    generateKey,
    getKeys,
    getMessage
} from 'pmcrypto';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import getRandomValues from 'get-random-values';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { noop } from '../helpers/function';

/**
 * Decrypts a member token with the organization private key
 * @param  {String} token
 * @param  {Object} decryptedOrganizationKey decrypted organization private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
export const decryptMemberToken = async (token, decryptedOrganizationKey) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [decryptedOrganizationKey],
        publicKeys: decryptedOrganizationKey.toPublic()
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        throw new Error('Signature verification failed');
    }

    return decryptedToken;
};

/**
 * Generates the member token to decrypt its member key
 * @return {String}
 */
export const generateMemberToken = () => {
    const value = getRandomValues(new Uint8Array(128));
    return encodeBase64(arrayToBinaryString(value));
};

/**
 * @param {String} backupPassword
 * @param {Object} organizationKey
 * @return {Promise<{backupKeySalt, backupArmoredPrivateKey}>}
 */
export const getBackupKeyData = async ({ backupPassword, organizationKey }) => {
    const backupKeySalt = generateKeySalt();
    const backupKeyPassword = await computeKeyPassword(backupPassword, backupKeySalt);
    const backupArmoredPrivateKey = await encryptPrivateKey(organizationKey, backupKeyPassword);

    return {
        backupKeySalt,
        backupArmoredPrivateKey
    };
};

/**
 * @param {String} keyPassword
 * @param {String} backupPassword
 * @param {Object} encryptionConfig
 * @return {Promise<{privateKeyArmored, privateKey}>}
 */
export const generateOrganizationKeys = async ({ keyPassword, backupPassword, encryptionConfig }) => {
    const { key: privateKey, privateKeyArmored } = await generateKey({
        userIds: [{ name: 'not_for_email_use@domain.tld', email: 'not_for_email_use@domain.tld' }],
        passphrase: keyPassword,
        ...encryptionConfig
    });

    await privateKey.decrypt(keyPassword);

    return {
        privateKey,
        privateKeyArmored,
        ...(await getBackupKeyData({ backupPassword, organizationKey: privateKey }))
    };
};

/**
 * @param {Array} nonPrivateMembers
 * @param {Array} nonPrivateMembersAddresses
 * @param {Object} oldOrganizationKey
 * @param {Object} newOrganizationKey
 * @return {Promise<Array>}
 */
export const reEncryptOrganizationTokens = ({
    nonPrivateMembers = [],
    nonPrivateMembersAddresses = [],
    oldOrganizationKey,
    newOrganizationKey
}) => {
    const newOrganizationPublicKey = newOrganizationKey.toPublic();

    const getMemberTokens = ({ Keys = [] }, i) => {
        const memberKeys = nonPrivateMembersAddresses[i].reduce((acc, { Keys: AddressKeys }) => {
            return acc.concat(AddressKeys);
        }, Keys);

        return memberKeys.map(async ({ ID, Token, Activation }) => {
            // TODO: Check if Token || Activation is really neccessary.
            const decryptedToken = await decryptMemberToken(Token || Activation, oldOrganizationKey);
            const { data } = await encryptMessage({
                data: decryptedToken,
                privateKeys: newOrganizationKey,
                publicKeys: newOrganizationPublicKey
            });

            return { ID, Token: data };
        });
    };

    return Promise.all(nonPrivateMembers.map(getMemberTokens).flat());
};

/**
 * Encrypt the member key password with a key.
 * @param  {String} token - The member key token
 * @param  {Object} privateKey - The key to encrypt the token with
 * @return {Object}
 */
export const encryptMemberToken = async (token, privateKey) => {
    const { data: encryptedToken } = await encryptMessage({
        data: token,
        publicKeys: [privateKey.toPublic()],
        privateKeys: [privateKey]
    });
    return encryptedToken;
};

/**
 * Decrypt the list of member keys with the organization key.
 * @param {Array} Keys
 * @param {Object} organizationKey
 * @return {Promise}
 */
export const prepareMemberKeys = (Keys, organizationKey) => {
    if (!organizationKey && Keys.length > 0) {
        throw new Error('Organization key required');
    }
    return Promise.all(
        Keys.map(async (Key) => {
            const { PrivateKey, Token, Activation } = Key;
            const decryptedToken = await decryptMemberToken(Token || Activation, organizationKey).catch(noop);

            const [privateKey] = await getKeys(PrivateKey);
            await privateKey.decrypt(decryptedToken).catch(noop);

            return {
                Key,
                privateKey
            };
        })
    );
};
