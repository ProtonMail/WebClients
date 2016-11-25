angular.module('proton.models.eo', [])
.factory('Eo', ($http, url, CONFIG) => {

    /**
     * Parse the JSON coming from the XHR request
     * @param  {XMLHttpRequest} xhr
     * @return {Object}
     */
    const parseJSON = (xhr) => {
        const response = (json, isInvalid = false) => ({ json, isInvalid });
        try {
            return response(JSON.parse(xhr.responseText));
        } catch (e) {
            return response({
                Error: `JSON parsing error: ${xhr.responseText}`
            }, true);
        }
    };

    const token = (tokenID) => {
        return $http.get(url.get() + '/eo/token/' + encodeURIComponent(tokenID), {
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                Accept: 'application/vnd.protonmail.v1+json'
            }
        });
    };

    const message = (Authorization, token) => {
        return $http.get(url.get() + '/eo/message', {
            headers: {
                Authorization,
                'x-eo-uid': token
            }
        });
    };

    const attachment = (Authorization, token, attachmentID) => {
        return $http.get(url.get() + '/eo/attachment/' + attachmentID, {
            responseType: 'arraybuffer',
            headers: {
                Authorization,
                'x-eo-uid': token
            }
        });
    };

    const reply = (decryptedToken, token, data) => {
        const fd = new FormData();
        const xhr = new XMLHttpRequest();

        Object.keys(data || {}).forEach((key) => {
            if (Array.isArray(data[key])) {
                _.each(data[key], (v) => fd.append(key, v));
            } else {
                fd.append(key + '', data[key]);
            }
        });

        return new Promise((resolve, reject) => {
            xhr.onload = function onload() {
                const { json, isInvalid } = parseJSON(xhr);

                if (xhr.status !== 200) {
                    return reject(new Error('Unable to send the message'));
                }

                if (json.Error) {
                    const msgError = !isInvalid ? json.Error : 'Unable to send the message.';
                    return reject(new Error(msgError));
                }
                resolve('Message send');
            };

            xhr.open('post', url.get() + '/eo/reply', true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Accept', 'application/vnd.protonmail.v1+json');
            xhr.setRequestHeader('x-pm-appversion', 'Web_' + CONFIG.app_version);
            xhr.setRequestHeader('x-pm-apiversion', CONFIG.api_version);
            xhr.setRequestHeader('Authorization', decryptedToken);
            xhr.setRequestHeader('x-eo-uid', token);
            xhr.send(fd);
        });
    };

    return { token, message, attachment, reply };
});
