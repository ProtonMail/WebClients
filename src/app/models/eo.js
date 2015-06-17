angular.module("proton.models.eo", [])

.factory("Eo", function($http, authentication) {
    return {
        token: function(tokenID) {
            return $http.get(authentication.baseURL + '/eo/token/' + tokenID);
        },
        message: function(decrypted_token, token_id) {
            return $http.get(authentication.baseURL + '/eo/message', {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        attachment: function(decrypted_token, token_id, attachmentID) {
            return $http.get(authentication.baseURL + '/eo/attachment/' + attachmentID, {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        reply: function(decrypted_token, token_id, data) {
            return $http.post(authentication.baseURL + '/eo/reply', {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        }
    };
});
