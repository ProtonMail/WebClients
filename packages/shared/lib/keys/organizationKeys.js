import {
    arrayToBinaryString,
    decryptMessage,
    encodeBase64,
    encryptMessage,
    encryptPrivateKey,
    generateKey,
    getMessage
} from 'pmcrypto';
import { VERIFICATION_STATUS } from 'pmcrypto/lib/constants';
import getRandomValues from 'get-random-values';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { generateAddressKey } from './keys';

/**
 * Decrypts a member token with the organization private key
 * @param  {String} token
 * @param  {Object} privateKey decrypted private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
export const decryptMemberToken = async (token, privateKey) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [privateKey],
        publicKeys: privateKey.toPublic()
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Signature verification failed');
        error.name = 'SignatureError';
        throw error;
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
 * Generate member address for non-private users.
 * It requires that the user has been set up with a primary key first.
 * @param {Object} address - The address to generate keys for.
 * @param {Object} primaryKey - The primary key of the member.
 * @param {Object} organizationKey - The organization key.
 * @param {Object} encryptionConfig - The selected encryption config.
 * @return {Promise}
 */
export const generateMemberAddressKey = async ({ email, primaryKey, organizationKey, encryptionConfig }) => {
    const memberKeyToken = generateMemberToken();
    const orgKeyToken = generateMemberToken();

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email,
        passphrase: memberKeyToken,
        encryptionConfig
    });

    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, orgKeyToken);

    const [activationToken, organizationToken] = await Promise.all([
        encryptMemberToken(memberKeyToken, primaryKey),
        encryptMemberToken(memberKeyToken, organizationKey)
    ]);

    return {
        privateKey,
        privateKeyArmored,
        activationToken,
        privateKeyArmoredOrganization,
        organizationToken
    };
};
