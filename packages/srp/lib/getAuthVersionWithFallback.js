import { cleanUsername } from './utils/username';
import { AUTH_FALLBACK_VERSION } from './constants';

/**
 * Get the next auth version to use and if it's the last attempt.
 * @param {Object} authInfo
 * @param {String} username - The entered username
 * @param {number} [lastAuthVersion] - The previously attempted auth version
 * @return {Object}
 */
export default ({ Version }, username, lastAuthVersion) => {
    if (Version !== 0) {
        return {
            version: Version,
            done: true
        };
    }

    if (typeof lastAuthVersion === 'undefined') {
        return {
            version: AUTH_FALLBACK_VERSION,
            done: false
        };
    }

    if (lastAuthVersion === 2 && cleanUsername(username) !== username.toLowerCase()) {
        return {
            version: 1,
            done: false
        };
    }

    if (lastAuthVersion === 1 || lastAuthVersion === 2) {
        return {
            version: 0,
            done: true
        };
    }

    throw new Error('Can not provide any other auth version');
};
