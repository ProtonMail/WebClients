angular.module("proton.attachments", [
    "proton.authentication"
])
.service("attachments", function(
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
    CONSTANTS,
    CONFIG
) {
    return {
        // read the file locally, and encrypt it. return the encrypted file.
        load: function(file, key) {
            var q = $q.defer();
            var fileObject = {};
            var reader = new FileReader();

            if(angular.isUndefined(key)) {
                key = authentication.user.PublicKey;
            }

            if (!file) {
                q.reject(new TypeError("You did not provide a file"));
            }

            reader.onloadend = function(event) {
                // encryptFile(data, pubKeys, passwords, filename)
                var encAttachment = pmcw.encryptFile(new Uint8Array(reader.result), key, [], file.name);

                return encAttachment.then(
                    function(packets) {
                        packets.Filename = file.name;
                        packets.MIMEType = file.type;
                        packets.FileSize = file.size;
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
        upload: function(packets, MessageID, tempPacket) {
            var deferred = $q.defer();
            var data = new FormData();
            var xhr = new XMLHttpRequest();
            var sessionKeyPromise = this.getSessionKey(packets.keys);
            var attachmentData = {};
            var that = this;

            data.append('Filename', packets.Filename);
            data.append('MessageID', MessageID);
            data.append('MIMEType', packets.MIMEType);
            data.append('KeyPackets', new Blob([packets.keys]));
            data.append('DataPacket', new Blob([packets.data]));

            attachmentData.filename = packets.Filename;
            attachmentData.fileSize = packets.FileSize;
            attachmentData.MIMEType = packets.MIMEType;
            attachmentData.loading = true;

            tempPacket.cancel = function() {
                xhr.abort();
                deferred.resolve('aborted');
            };

            xhr.upload.onprogress = function (event) {
                var progress = (event.loaded / event.total)*99;
                that.uploadProgress(progress, tempPacket.elem);
            };

            xhr.onload = function() {
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
                    notify('Unable to upload file. Please try again.');
                    attachmentData.loading = false;
                    deferred.reject();
                    return;
                } else if (response.Error !== undefined) {
                    if (validJSON) {
                        // Attachment disallowed by back-end size limit (no change in size)
                        notify(response.Error);
                    } else {
                        notify('Unable to upload.');
                    }
                    attachmentData.loading = false;
                } else {
                    attachmentData.AttachmentID = response.AttachmentID;
                    sessionKeyPromise.then(function(sessionKey) {
                        attachmentData.sessionKey = sessionKey;
                        attachmentData.loading = false;
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
            xhr.setRequestHeader("x-pm-session", pmcw.decode_base64(window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken')));
            xhr.send(data);

            return deferred.promise;
        },
        getSessionKey:function(keypacket) {
            return authentication.getPrivateKey().then(function (key) {
                return pmcw.decryptSessionKey(keypacket,key);
            });
        },
        get: function(id) {
            return $http
                .get(url.get() + "/attachments/" + id, {responseType: "arraybuffer"})
                .success(function(data, status, headers, other) {
                    return data;
                }).error(function(response) {
                    $log.debug(response);
                });
        },
        uploadProgress: function(progress, elem) {
            $(elem).css({'background' : '-webkit-linear-gradient(left, rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 0.5) ' + 0 + '%)'});
            $(elem).css({'background' : '-moz-linear-gradient(left,    rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 0.5) ' + 0 + '%)'});
            $(elem).css({'background' : '-o-linear-gradient(left,      rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 0.5) ' + 0 + '%)'});
            $(elem).css({'background' : '-ms-linear-gradient(left,     rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 0.5) ' + 0 + '%)'});
            $(elem).css({'background' : 'linear-gradient(left,         rgba(' + CONSTANTS.UPLOAD_GRADIENT_DARK + ', 1) ' + progress + '%, rgba(' + CONSTANTS.UPLOAD_GRADIENT_LIGHT + ', 0.5) ' + 0 + '%)'});
        }
    };
});
