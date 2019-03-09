import { computeKeyPassword } from 'pm-srp';
import { decryptPrivateKey as decryptPrivateKeyPmcrypto, getMessage, decryptMessage } from 'pmcrypto';

import { getUser } from '../api/user';
import { getKeySalts } from '../api/keys';
import { setCookies } from '../api/auth';
import { getRandomString } from '../helpers/string';

export const hasTotp = ({ '2FA': { TOTP } }) => {
    return !!TOTP;
};

export const hasUnlock = ({ PasswordMode }) => {
    return PasswordMode !== 1;
};

export const isPgpMessage = (accessToken) => {
    return /^-----BEGIN PGP MESSAGE-----/.test(accessToken);
};

/**
 * Compute the key password with support for old versions without salt.
 * @param {String} password
 * @param {String} salt
 * @returns {Promise<String>}
 */
export const computeKeyPasswordWithFallback = (password, salt) => {
    if (!salt) {
        return password;
    }
    return computeKeyPassword(password, salt);
};

/**
 * Override decrypt private key to throw an identifiable error
 * TODO: Put this in pmcrypto.
 * @param {String} privateKey
 * @param {String} keyPassword
 * @returns {Promise}
 */
export const decryptPrivateKey = async (privateKey, keyPassword) => {
    try {
        return await decryptPrivateKeyPmcrypto(privateKey, keyPassword);
    } catch (e) {
        const error = new Error('Wrong decryption password');
        error.name = 'PasswordError';
        throw error;
    }
};

export const decryptAccessToken = async (accessToken, privateKey) => {
    const message = await getMessage(accessToken);
    const { data } = await decryptMessage({
        message,
        privateKeys: [privateKey]
    });
    return data;
};

const setCookiesRouteHelper = ({ UID, accessToken, refreshToken, signal }) => {
    const cookiesConfig = setCookies({
        UID,
        AuthToken: accessToken,
        RefreshToken: refreshToken,
        State: getRandomString(24)
    });
    return {
        ...cookiesConfig,
        signal
    };
};

const handleEncryptedAccessToken = async ({ api, authResult, mailboxPassword, abortController }) => {
    const { AccessToken, RefreshToken, UID, PrivateKey, KeySalt } = authResult;

    const keyPassword = await computeKeyPasswordWithFallback(mailboxPassword, KeySalt);
    const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, keyPassword);
    const accessToken = await decryptAccessToken(AccessToken, decryptedPrivateKey);

    await api(
        setCookiesRouteHelper({
            UID,
            accessToken,
            refreshToken: RefreshToken,
            signal: abortController.signal
        })
    );

    const { User } = await api(getUser(UID));

    return {
        keyPassword,
        UID,
        User
    };
};

const handleUnencryptedAccessToken = async ({ api, authResult, mailboxPassword, abortController }) => {
    const { AccessToken, RefreshToken, UID } = authResult;

    await api(
        setCookiesRouteHelper({
            UID,
            accessToken: AccessToken,
            refreshToken: RefreshToken,
            signal: abortController.signal
        })
    );

    const { User } = await api(getUser(UID));
    const [primaryKey] = User.Keys || [];
    const { PrivateKey, ID } = primaryKey;

    const keySalts = await api(getKeySalts(UID));
    const { KeySalts = [] } = keySalts;
    const keySaltMap = KeySalts.reduce((acc, salt) => {
        acc[salt.ID] = salt;
        return acc;
    }, {});
    const { Salt } = keySaltMap[ID];

    const keyPassword = await computeKeyPassword(mailboxPassword, Salt);
    // Test decrypt so it can throw the error if the key password is wrong.
    await decryptPrivateKey(PrivateKey, keyPassword);

    return {
        keyPassword,
        UID,
        User
    };
};

export const handleAuthenticationToken = (params) => {
    const {
        authResult: { AccessToken }
    } = params;
    return isPgpMessage(AccessToken) ? handleEncryptedAccessToken(params) : handleUnencryptedAccessToken(params);
};
