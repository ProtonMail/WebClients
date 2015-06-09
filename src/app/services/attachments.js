angular.module("proton.attachments", [
    "proton.authentication"
])
    .service("attachments", function($http, $log, $window, $q, $rootScope, authentication, notify, pmcw, errorReporter, CONSTANTS) {
        return {
            load: function(file) {
                var q = $q.defer();
                var fileObject = {};
                var reader = new FileReader();

                if (!file) {
                    q.reject(new TypeError("You did not provide a file"));
                }

                reader.onloadend = function(event) {
                    pmcw.encryptFile(new Uint8Array(reader.result), authentication.user.PublicKey, [], file.name)
                    .then(function(packets) {
                        packets.FileName = file.name;
                        packets.MIMEType = file.type;
                        packets.FileSize = file.size;
                        q.resolve(packets);
                    })
                    .catch(function(err) {
                        q.reject('Failed to encrypt attachment. Please try again.');
                    });
                };

                reader.readAsArrayBuffer(file);

                return q.promise;
            },
            upload: function(packets) {
                // console.log('upload', packets); // TODO remove

                var data = new FormData();
                var xhr = new XMLHttpRequest();
                var sessionKeyPromise = this.getSessionKey(packets.keys);

                data.append('keys[]', new Blob([packets.keys]));
                data.append('data[]', new Blob([packets.data]));
                data.append('FileName', packets.name);
                data.append('MIMEType', packets.type);

                // TODO if draft id empty
                // notify('No draft for attachments!');

                xhr.onload = function() {
                    var response;

                    try {
                        response = JSON.parse(this.responseText);
                    } catch (error) {
                        response = {
                            'Error': 'JSON parsing error: ' + this.responseText
                        };
                    }

                    var statusCode = this.status;

                    if (statusCode !== 200) {
                        // Error with the request
                        notify('Unable to upload file. Please try again.');
                        return;
                    } else if (response.Error !== undefined) {
                        // Attachment disallowed by back-end size limit (no change in size)
                        notify('Sorry, uploaded attachments are limited to ' + CONSTANTS.ATTACHMENT_SIZE_LIMIT + ' MB.');
                        return;
                    }

                    sessionKeyPromise.then(function(sessionKey) {
                        // TODO
                        // var remove = attachID+' .removeBtn';
                        // var link = attachID+' .attachment-link';

                        // $(remove).removeClass('fileUploading');
                        // $(remove).attr("data-id", id);
                        // $(remove).attr("data-size", size);
                        // $(remove).css({'color' : 'white'});
                        // changeLoadBar(attachID, 99, 100, 0, 1);

                        // $(link).attr("data-id", id);
                        // $(link).attr("data-type", packets.type);
                        // $(link).attr("data-key", pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(sessionKey.key)));
                        // $(link).attr("data-algo", sessionKey.algo);
                        // $(link).addClass('finished');

                        // setAttachmentsSize();
                    });
                };

                xhr.open('post', '/api/upload_attachment', true); // TODO need API url
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                xhr.send(data);
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
