import { getMessage, decryptMessage, decryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';

export const hasTotp = ({ '2FA': { TOTP } }) => {
    return !!TOTP;
};

export const hasUnlock = ({ PasswordMode }) => {
    return PasswordMode !== 1;
};

/**
 * TODO: Move this to pmcrypto.
 * @param {String} accessToken
 * @return {boolean}
 */
export const isPgpMessage = (accessToken) => {
    return /^-----BEGIN PGP MESSAGE-----/.test(accessToken);
};

/**
 * TODO: Move this to pmcrypto.
 * @param {String} accessToken
 * @param {privateKey} privateKey decrypted private key object
 * @return {Promise<void>}
 */
export const decryptAccessToken = async (accessToken, privateKey) => {
    const message = await getMessage(accessToken);
    const { data } = await decryptMessage({
        message,
        privateKeys: [privateKey]
    });
    return data;
};

/**
 * Get access token with forwards compat.
 * TODO: Not needed once the API has deprecated encrypted access tokens.
 * @param {String} AccessToken
 * @param {String} PrivateKey
 * @param {String} KeySalt
 * @param {String} password
 * @returns {Promise<String>}
 */
export const getAccessToken = async (AccessToken, PrivateKey, KeySalt, password) => {
    if (!isPgpMessage(AccessToken)) {
        return AccessToken;
    }
    const keyPassword = await computeKeyPassword(password, KeySalt);
    const privateKey = await decryptPrivateKey(PrivateKey, keyPassword);
    return decryptAccessToken(AccessToken, privateKey);
};
