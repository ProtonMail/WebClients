/**
 * Clean the username, remove underscore, dashes, dots and lowercase.
 */
export const cleanUsername = (name = '') => name.replace(/[.\-_]/g, '').toLowerCase();

/**
 * Validate username for old auth versions.
 */
export const checkUsername = (authVersion: number, username?: string, usernameApi?: string) => {
    if (authVersion === 2) {
        if (!username || !usernameApi) {
            throw new Error('Missing username');
        }
        if (cleanUsername(username) !== cleanUsername(usernameApi)) {
            return false;
        }
    }

    if (authVersion <= 1) {
        if (!username || !usernameApi) {
            throw new Error('Missing username');
        }
        if (username.toLowerCase() !== usernameApi.toLowerCase()) {
            return false;
        }
    }

    return true;
};
