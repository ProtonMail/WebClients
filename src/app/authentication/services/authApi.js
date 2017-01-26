angular.module('proton.authentication')
    .factory('authApi', ($http, url) => {
        const requestURL = url.build('auth');
        return {
            /**
             * Revoke a token
             * @return {Promise}
             */
            revoke() {
                return $http.delete(requestURL());
            },
            /**
             * Revoke all other access tokens, locked
             * @return {Promise}
             */
            revokeOthers() {
                return $http.delete(requestURL('others'));
            }
        };
    });
