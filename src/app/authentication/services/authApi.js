import { getRandomString } from '../../../helpers/string';

export const getAuthHeaders = ({ UID, AccessToken }) => {
    return {
        headers: {
            'x-pm-uid': UID,
            Authorization: `Bearer ${AccessToken}`
        }
    };
};

/* @ngInject */
function authApi($http, compatApi, url) {
    const requestURL = url.build('auth');
    const unload = ({ data }) => data;
    return {
        /**
         * Refresh an expired token
         * @param {Object} config
         * @return {Promise}
         */
        refresh(config = {}) {
            return $http.post(requestURL('refresh'), undefined, config);
        },
        /**
         * Set secure cookies, web app only
         * @param {Object} config
         * @return {Promise}
         */
        cookies({ UID, AccessToken, RefreshToken }, config) {
            return $http.post(
                requestURL('cookies'),
                {
                    UID,
                    RefreshToken,
                    AccessToken,
                    ResponseType: 'token',
                    GrantType: 'refresh_token',
                    RedirectURI: 'https://protonmail.com',
                    State: getRandomString(24)
                },
                config
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
        auth2fa(data, config) {
            return $http.post(requestURL('2fa'), data, config).then(unload);
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
