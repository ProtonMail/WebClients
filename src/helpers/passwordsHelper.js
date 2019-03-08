import { computeKeyPassword } from 'pm-srp';

/**
 * Convert legacy credentials parameters to what pmcrypto expects.
 * NOTE: This will be removed and refactored in a second PR.
 * @param {String} Username
 * @param {String} Password
 * @param {String} TwoFactorCode
 * @return {Object}
 */
export const convertLegacyCredentials = ({ Username, Password, TwoFactorCode }) => {
    return {
        username: Username,
        password: Password,
        totp: TwoFactorCode
    };
};

/**
 * Compute the key password with support for old versions without salt.
 * @param {String} password
 * @param {String} salt
 * @return {Promise<String>}
 */
export const computeKeyPasswordWithFallback = (password, salt) => {
    if (!salt) {
        return password;
    }
    return computeKeyPassword(password, salt);
};
