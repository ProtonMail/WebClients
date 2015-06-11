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
    pmcw,
    errorReporter,
    CONSTANTS,
    OAUTH_KEY
) {
    return {
        // read the file locally, and encrypt it. return the encrypted file.
        load: function(file) {
            var q = $q.defer();
            var fileObject = {};
            var reader = new FileReader();

            if (!file) {
                q.reject(new TypeError("You did not provide a file"));
            }

            reader.onloadend = function(event) {
                // encryptFile(data, pubKeys, passwords, filename)
                var encAttachment = pmcw.encryptFile(new Uint8Array(reader.result), authentication.user.PublicKey, [], file.name);

                // console.log('encAttachment',encAttachment);

                return encAttachment.then(
                    function(packets) {
                        // console.log('packets', packets);
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
        upload: function(packets, MessageID) {
            var deferred = $q.defer();

            var data = new FormData();
            var xhr = new XMLHttpRequest();
            var sessionKeyPromise = this.getSessionKey(packets.keys);
            var attachmentData = {};

            data.append('Filename', packets.Filename);
            data.append('MessageID', MessageID);
            data.append('MIMEType', packets.MIMEType);
            data.append('KeyPackets', new Blob([packets.keys]));
            data.append('DataPacket', new Blob([packets.data]));

            attachmentData.filename = packets.Filename;
            attachmentData.fileSize = packets.fileSize;
            attachmentData.MIMEType = packets.MIMEType;

            // TODO if draft id empty
            // notify('No draft for attachments!');

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
                    return;
                } else if (response.Error !== undefined) {
                    if (validJSON) {
                        // Attachment disallowed by back-end size limit (no change in size)
                        notify(response.Error);
                    } else {
                        notify('Unable to upload.');
                    }
                    // TODO enable this. its disabled cause the API isnt ready.
                    // return;
                } else {
                    attachmentData.AttachmentID = response.AttachmentID;
                    sessionKeyPromise.then(function(sessionKey) {
                        attachmentData.sessionKey = sessionKey;
                        deferred.resolve(attachmentData);
                    });
                }
            };

            xhr.open('post', authentication.baseURL +'/attachments/upload', true); // TODO need API url
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Accept", "application/vnd.protonmail.v1+json");
            xhr.setRequestHeader("Authorization", "Bearer " + window.localStorage[OAUTH_KEY + ":AccessToken"]);
            xhr.setRequestHeader("x-pm-uid", window.localStorage[OAUTH_KEY + ":Uid"]);
            xhr.send(data);

            // return attachment object

            return deferred.promise;

        },
        removeAttachment: function(file) {

        },
        getSessionKey:function(keypacket) {
            return authentication.getPrivateKey().then(function (key) {
                return pmcw.decryptSessionKey(keypacket,key);
            });
        },
        get: function(id, filename) {
            $http
                .get(authentication.baseURL + "/attachments/" + id, {
                    responseType: "arraybuffer"
                })
                .success(function(data, status, headers, other) {
                    var octetStreamMime = "application/octet-stream",
                        contentType;

                    // Get the headers
                    headers = headers();

                    // Determine the content type from the header or default to "application/octet-stream"
                    contentType = headers["content-type"] || octetStreamMime;
                    var blob, url;
                    if (navigator.msSaveBlob) {
                        blob = new Blob([data], {
                            type: contentType
                        });
                        navigator.msSaveBlob(blob, filename);
                    } else {
                        var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                        if (urlCreator) {
                            // Try to use a download link
                            var link = document.createElement("a");

                            if ("download" in link) {
                                // Prepare a blob URL
                                blob = new Blob([data], {
                                    type: contentType
                                });
                                url = urlCreator.createObjectURL(blob);

                                link.setAttribute("href", url);
                                link.setAttribute("download", filename);

                                // Simulate clicking the download link
                                var event = document.createEvent('MouseEvents');
                                event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                link.dispatchEvent(event);
                            } else {
                                // Prepare a blob URL
                                // Use application/octet-stream when using window.location to force download

                                try {
                                    if (_.isNull(data) || data.length === 0) {
                                        throw new TypeError("File has a size of 0");
                                    }

                                    blob = new Blob([data], {
                                        type: octetStreamMime
                                    });
                                    url = urlCreator.createObjectURL(blob);
                                    $window.location = url;
                                } catch (err) {
                                    return errorReporter.notify("The file could not be downloaded", err);
                                }
                            }
                        }
                    }
                }).error(function(response) {
                    $log.debug(response);
                });
        }
    };
});
