angular.module('proton.models.invite', [])

.factory('Invite', ($http, url) => {
    const Invite = {
        /**
         * Validate invitation
         * @param {String} Token
         * @param {String} Username
         * @return {Promise}
         */
        check(Token, Username) {
            return $http.post(url.get() + '/invites/check', { Token, Username });
        }
    };

    return Invite;
});
