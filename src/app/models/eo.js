angular.module('proton.models.eo', [])

.factory('Eo', ($http, $q, url, CONFIG) => {
    return {
        token(tokenID) {
            return $http.get(url.get() + '/eo/token/' + encodeURIComponent(tokenID), {
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    Accept: 'application/vnd.protonmail.v1+json'
                }
            });
        },
        message(Authorization, token) {
            return $http.get(url.get() + '/eo/message', {
                headers: {
                    Authorization,
                    'x-eo-uid': token
                }
            });
        },
        attachment(Authorization, token, attachmentID) {
            return $http.get(url.get() + '/eo/attachment/' + attachmentID, {
                responseType: 'arraybuffer',
                headers: {
                    Authorization,
                    'x-eo-uid': token
                }
            });
        },
        reply(decryptedToken, token, data) {
            const deferred = $q.defer();
            const fd = new FormData();
            const xhr = new XMLHttpRequest();

            Object.keys(data || {}).forEach((key) => {
                if (angular.isArray(data[key])) {
                    _.each(data[key], (v) => {
                        fd.append(key, v);
                    });
                } else {
                    fd.append(key + '', data[key]);
                }
            });

            xhr.onload = function onload() {
                let response;
                let validJSON;
                const statusCode = this.status;

                try {
                    response = JSON.parse(this.responseText);
                    validJSON = true;
                } catch (error) {
                    response = {
                        Error: 'JSON parsing error: ' + this.responseText
                    };
                    validJSON = false;
                }

                if (statusCode !== 200) {
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
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Accept', 'application/vnd.protonmail.v1+json');
            xhr.setRequestHeader('x-pm-appversion', 'Web_' + CONFIG.app_version);
            xhr.setRequestHeader('x-pm-apiversion', CONFIG.api_version);
            xhr.setRequestHeader('Authorization', decryptedToken);
            xhr.setRequestHeader('x-eo-uid', token);
            xhr.send(fd);

            return deferred.promise;
        }
    };
});
