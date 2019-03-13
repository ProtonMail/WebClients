import { getMessage, decryptMessage } from 'pmcrypto';

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
