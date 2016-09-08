angular.module('proton.attachments', ['proton.authentication', 'proton.storage'])
.service('attachments', function(
    $http,
    $log,
    $window,
    $q,
    $rootScope,
    authentication,
    notify,
    url,
    pmcw,
    errorReporter,
    gettextCatalog,
    CONSTANTS,
    CONFIG,
    secureSessionStorage
) {
    return {
        store: [],
        push : function(data) {
            this.store.push(data);
        },
        fetch: function(){
            return this.store;
        },
        flush: function(){
            this.store = [];
        },
        // read the file locally, and encrypt it. return the encrypted file.
        load: function(file, key) {
            var q = $q.defer();
            var fileObject = {};
            var reader = new FileReader();

            if (!file) {
                q.reject(new TypeError("You did not provide a file"));
            }

            reader.onloadend = function(event) {
                // encryptFile(data, pubKeys, passwords, filename)
                var Uint8 = new Uint8Array(reader.result);
                var encAttachment = pmcw.encryptFile(Uint8, key, [], file.name);

                return encAttachment.then(
                    function(packets) {
                        packets.Filename = file.name;
                        packets.MIMEType = file.type;
                        packets.FileSize = file.size;
                        packets.Inline = file.inline;
                        packets.Preview = Uint8;
                        q.resolve(packets);
                    }
                )
                .catch(function(err) {
                    q.reject('Failed to encrypt attachment. Please try again.');
                });
            };

            reader.readAsArrayBuffer(file);

            return q.promise;
        },
        upload: function(packets, message, tempPacket) {
            var deferred = $q.defer();
            var data = new FormData();
            var xhr = new XMLHttpRequest();
            var keys = authentication.getPrivateKeys(message.AddressID);
            var sessionKeyPromise = pmcw.decryptSessionKey(packets.keys, keys);
            var attachmentData = {};
            var that = this;

            data.append('Filename', packets.Filename);
            data.append('MessageID', message.ID);
            data.append('MIMEType', packets.MIMEType);
            data.append('Inline', packets.Inline);
            data.append('KeyPackets', new Blob([packets.keys]));
            data.append('DataPacket', new Blob([packets.data]));

            attachmentData.filename = packets.Filename;
            attachmentData.Size = packets.FileSize;
            attachmentData.MIMEType = packets.MIMEType;
            attachmentData.Inline = packets.Inline;
            attachmentData.uploading = false;

            tempPacket.cancel = function() {
                xhr.abort();
                deferred.resolve('aborted');
            };

            xhr.upload.onprogress = function (event) {
                var progress = (event.loaded / event.total)*99;
                that.uploadProgress(progress, tempPacket.elem);
            };

            xhr.onload = function() {
                tempPacket.uploading = false;
                var response;
                var validJSON;

                try {
                    response = JSON.parse(this.responseText);
                    validJSON = true;
                } catch (error) {
                    response = {
                        'Error': 'JSON parsing error: ' + this.responseText
                    };
                    validJSON = false;
                }

                var statusCode = this.status;

                if (statusCode !== 200) {
                    // Error with the request
                    notify({message: gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error'), classes: 'notification-danger'});
                    deferred.reject(response);
                } else if (response.Error !== undefined) {
                    if (validJSON) {
                        // Attachment disallowed by back-end size limit (no change in size)
                        notify({message: response.Error, classes: 'notification-danger'});
                        deferred.reject(response);
                    } else {
                        notify({message: gettextCatalog.getString('Unable to upload file. Please try again', null, 'Error'), classes: 'notification-danger'});
                        deferred.reject(response);
                    }
                } else {
                    attachmentData.AttachmentID = response.AttachmentID;
                    attachmentData.Headers = response.Attachment.Headers;

                    sessionKeyPromise.then(function(sessionKey) {
                        attachmentData.sessionKey = sessionKey;
                        deferred.resolve(attachmentData);
                    });
                }
            };

            xhr.open('post', url.get() +'/attachments/upload', true);
            xhr.withCredentials = true;
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Accept", "application/vnd.protonmail.v1+json");
            xhr.setRequestHeader("x-pm-appversion", 'Web_' + CONFIG.app_version);
            xhr.setRequestHeader("x-pm-apiversion", CONFIG.api_version);
            xhr.setRequestHeader("x-pm-session", pmcw.decode_base64(secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken')));

            xhr.send(data);

            return deferred.promise;
        },

        /**
         * Get an attachement.
         * - If it's coming from the cache, we will get the decrypted attachment
         * - If it's not inside the cache, get encrypted version
         * @param  {String} ID Attachment.ID
         * @return {Promise}
         */
        get(ID) {
            const attachment = _.findWhere(this.store, {ID});
            if(!attachment) {
                return $http
                    .get(`${url.get()}/attachments/${ID}`, {
                        responseType: 'arraybuffer'
                    })
                    .then(({ data }) => ({
                        attachment: data,
                        isCache: false
                    }))
                    .catch($log.debug);
            }

            return $q.resolve({
                attachment,
                isCache: true
            });
        },
        uploadProgress: function(progress, elem) {
            const $elem = $(elem);
            $elem.css({'background' : '-webkit-linear-gradient(left, rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 1) ' + 0 + '%)'});
            $elem.css({'background' : '-moz-linear-gradient(left,    rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 1) ' + 0 + '%)'});
            $elem.css({'background' : '-o-linear-gradient(left,      rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 1) ' + 0 + '%)'});
            $elem.css({'background' : '-ms-linear-gradient(left,     rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 1) ' + 0 + '%)'});
            $elem.css({'background' : 'linear-gradient(left,         rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 1) ' + 0 + '%)'});
        }
    };
});
