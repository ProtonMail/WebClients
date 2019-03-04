/**
 * Clean the username, remove underscore, dashes, dots and lowercase.
 * @param {String} name
 * @returns {string}
 */
export const cleanUsername = (name = '') => name.replace(/[.\-_]/g, '').toLowerCase();

/**
 * Validate username for old auth versions.
 * @param {Number} authVersion
 * @param {String} username
 * @param {String} usernameApi
 * @return {boolean}
 */
export const checkUsername = (authVersion, username, usernameApi) => {
    if (authVersion === 2) {
        if (cleanUsername(username) !== cleanUsername(usernameApi)) {
            return false;
        }
    }

    if (authVersion <= 1) {
        if (username.toLowerCase() !== usernameApi.toLowerCase()) {
            return false;
        }
    }

    return true;
};
