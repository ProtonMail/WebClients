angular.module("proton.models.eo", [])

.factory("Eo", function($http, $q, url, CONFIG) {
    return {
        token: function(tokenID) {
            return $http.get(url.get() + '/eo/token/' + encodeURIComponent(tokenID), {
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Accept': 'application/vnd.protonmail.v1+json'
                }
            });
        },
        message: function(decrypted_token, token_id) {
            return $http.get(url.get() + '/eo/message', {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        attachment: function(decrypted_token, token_id, attachmentID) {
            return $http.get(url.get() + '/eo/attachment/' + attachmentID, {
                responseType: "arraybuffer",
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        reply: function(decrypted_token, token_id, data) {
            var deferred = $q.defer();
            var fd = new FormData();
            var xhr = new XMLHttpRequest();

            _.each(Object.keys(data), function(key) {
                if(angular.isArray(data[key])) {
                    _.each(data[key], function(v) {
                        fd.append(key, v);
                    });
                } else {
                    fd.append(key+'', data[key]);
                }
            });

            xhr.onload = function() {
                var response;
                var validJSON;
                var statusCode = this.status;

                try {
                    response = JSON.parse(this.responseText);
                    validJSON = true;
                } catch (error) {
                    response = {
                        'Error': 'JSON parsing error: ' + this.responseText
                    };
                    validJSON = false;
                }

                if(statusCode !== 200) {
                    deferred.reject('Unable to send the message');
                } else if (response.Error !== undefined) {
                    if (validJSON) {
                        deferred.reject(response.Error);
                    } else {
                        deferred.reject('Unable to send the message.');
                    }
                } else {
                    deferred.resolve('Message send');
                }
            };

            xhr.open('post', url.get() + '/eo/reply', true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Accept", "application/vnd.protonmail.v1+json");
            xhr.setRequestHeader("x-pm-appversion", 'Web_' + CONFIG.app_version);
            xhr.setRequestHeader("x-pm-apiversion", CONFIG.api_version);
            xhr.setRequestHeader("Authorization", decrypted_token);
            xhr.setRequestHeader("x-eo-uid", token_id);
            xhr.send(fd);

            return deferred.promise;
        }
    };
});
