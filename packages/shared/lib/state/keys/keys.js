import { decryptMessage, decryptPrivateKey, getMessage, keyInfo } from 'pmcrypto';

import { MAIN_USER_KEY } from '../../constants';

const noop = () => {};

const prepareKeysHelper = async (decryptKeyCb, UserKeys = [], Addresses = []) => {
    const userKeysPromise = Promise.all(UserKeys.map(decryptKeyCb));

    const addressKeysPromise = Promise.all(
        Addresses.map(async ({ ID, Keys: AddressKeys = [] }) => {
            const keys = await Promise.all(AddressKeys.map(decryptKeyCb));
            return {
                keys,
                ID
            };
        })
    );

    const [userKeys, addressKeys] = await Promise.all([userKeysPromise, addressKeysPromise]);

    const addressKeysMap = addressKeys.reduce((acc, { ID, keys }) => {
        acc[ID] = keys;
        return acc;
    }, {});

    return {
        [MAIN_USER_KEY]: userKeys,
        ...addressKeysMap
    };
};

/**
 * Decrypts a member token with the organization private key
 * @param  {String} token
 * @param  {Object} orgPrivateKey decrypted organization private key
 * @return {Object} {PrivateKey, decryptedToken}
 */
const decryptMemberToken = async (token, orgPrivateKey = {}) => {
    const { data: decryptedToken, verified } = await decryptMessage({
        message: await getMessage(token),
        privateKeys: [orgPrivateKey],
        publicKeys: orgPrivateKey.toPublic()
    });

    if (verified !== 1) {
        throw new Error('Signature verification failed');
    }

    return decryptedToken;
};

/**
 * Decrypts a member key using the decrypted member token
 * @param  {Object} signingKey organization private key
 * @param  {Object} key object from API
 * @return {Object} decrypted key
 */
const decryptMemberKey = (signingKey) => async (Key) => {
    const { PrivateKey, Token, Activation } = Key;
    // TODO: Does it need to check Token || Activation?
    const decryptedToken = await decryptMemberToken(Token || Activation, signingKey).catch(noop);
    const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, decryptedToken);
    return {
        decryptedPrivateKey,
        Key,
        info: await keyInfo(PrivateKey)
    };
};

const decryptKey = (keyPassword) => async (Key) => {
    const { PrivateKey } = Key;
    const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, keyPassword).catch(noop);
    return {
        decryptedPrivateKey,
        Key,
        info: await keyInfo(PrivateKey)
    };
};

export const prepareKeys = async ({ Keys: UserKeys = [], OrganizationPrivateKey }, Addresses, keyPassword) => {
    if (OrganizationPrivateKey) {
        const decryptedOrganizationKey = await decryptKey(OrganizationPrivateKey, keyPassword);
        const decryptKeyWithKey = decryptMemberKey(decryptedOrganizationKey);
        return prepareKeysHelper(decryptKeyWithKey, UserKeys, Addresses);
    }
    const decryptKeyWithPassword = decryptKey(keyPassword);
    return prepareKeysHelper(decryptKeyWithPassword, UserKeys, Addresses);
};
