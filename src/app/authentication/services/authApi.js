import { setCookies } from 'proton-shared/lib/api/auth';

import { getRandomString } from '../../../helpers/string';

/* @ngInject */
function authApi($http, compatApi, url) {
    const requestURL = url.build('auth');
    const unload = ({ data }) => data;
    return {
        /**
         * Refresh an expired token
         * @param {Object} params
         * @param {Object} config
         * @return {Promise}
         */
        refresh(params = {}, config = {}) {
            return $http.post(requestURL('refresh'), params, config);
        },
        /**
         * Set secure cookies, web app only
         * @param {Object} params
         * @return {Promise}
         */
        cookies({ UID, AccessToken, RefreshToken }) {
            return compatApi(
                setCookies({
                    UID,
                    RefreshToken,
                    AccessToken,
                    RedirectURI: 'https://protonmail.com',
                    State: getRandomString(24)
                })
            );
        },
        /**
         * Set up SRP authentication request
         * @param {String} Username
         * @return {Promise}
         */
        info(Username) {
            return $http.post(requestURL('info'), { Username }).then(unload);
        },
        /**
         * @return {Promise}
         */
        modulus() {
            return $http.get(requestURL('modulus')).then(unload);
        },
        /**
         * Revoke a token
         * @return {Promise}
         */
        revoke() {
            return $http.delete(requestURL());
        },
        /**
         * Get active sessions
         * @return {Promise}
         */
        sessions() {
            return $http.get(requestURL('sessions'));
        },
        /**
         * Revoke a session by UID, locked
         * @param  {String} uid Token
         * @return {Promise}
         */
        revokeSession(uid) {
            return $http.delete(requestURL('sessions', uid));
        },
        /**
         * Revoke all other access tokens, locked
         * @return {Promise}
         */
        revokeOthers() {
            return $http.delete(requestURL('sessions'));
        }
    };
}
export default authApi;
