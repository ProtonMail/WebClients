import _ from 'lodash';

/* @ngInject */
function Eo($http, url, CONFIG, gettextCatalog) {
    const requestURL = url.build('eo');

    const I18N = {
        SEND_ERROR: gettextCatalog.getString('Unable to send the message.', null, 'Error')
    };

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
            return response(
                {
                    Error: `JSON parsing error: ${xhr.responseText}`
                },
                true
            );
        }
    };

    const token = (tokenID) => {
        return $http.get(requestURL('token', encodeURIComponent(tokenID)), {
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                Accept: 'application/vnd.protonmail.v1+json'
            }
        });
    };

    const message = (Authorization, token) => {
        return $http.get(requestURL('message'), {
            headers: {
                Authorization,
                'x-eo-uid': token
            }
        });
    };

    const attachment = (Authorization, token, attachmentID) => {
        return $http.get(requestURL('attachment', attachmentID), {
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

                if (json.Error) {
                    const msgError = !isInvalid ? json.Error : I18N.SEND_ERROR;
                    return reject(new Error(msgError));
                }

                if (xhr.status !== 200) {
                    // TODO: Handle offline, upgrade required, etc...
                    return reject(new Error(I18N.SEND_ERROR));
                }

                resolve('Message send');
            };

            xhr.open('post', requestURL('reply'), true);
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
}
export default Eo;
