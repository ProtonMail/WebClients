angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants",
    "proton.storage"
])

.controller("OutsideController", function(
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $sce,
    $stateParams,
    $timeout,
    gettextCatalog,
    Attachment,
    CONSTANTS,
    Eo,
    embedded,
    Message,
    attachments,
    authentication,
    prepareContent,
    message,
    notify,
    pmcw,
    tools,
    networkActivityTracker,
    secureSessionStorage
) {
    // Variables
    var decrypted_token = secureSessionStorage.getItem("proton:decrypted_token");
    var password = pmcw.decode_utf8_base64(secureSessionStorage.getItem("proton:encrypted_password"));
    var token_id = $stateParams.tag;

    function clean(body) {
        var content = angular.copy(body);

        content = DOMPurify.sanitize(content, {
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['style', 'input', 'form']
        });

        if ($state.is('eo.reply')) {
            content = '<br /><br /><blockquote>' + content + '</blockquote>';
        }

        return prepareContent(content, message);
    }

    $scope.initialization = function() {
        if ($state.is('eo.reply')) {
            message.showImages = true;
            message.showEmbedded = true;
        }

        message.setDecryptedBody(clean(message.getDecryptedBody()));

        if ($state.is('eo.message')) {
            _.each(message.Replies, function(reply) {
                reply.Body = clean(reply.Body);
            });
        }

        embedded.parser(message).then( (result) => {

            message.setDecryptedBody(result);


            $scope.message = message;
        });


        $('#inputFile').change(function(event) {
            event.preventDefault();

            var files = $('#inputFile')[0].files;

            for (var i = 0; i<files.length; i++) {
                var file = files[i];

                if (file.size > CONSTANTS.ATTACHMENT_SIZE_LIMIT * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE) {
                    notify({message: 'Attachments are limited to ' + sizeLimit + ' MB.', classes: 'notification-danger'});
                } else {
                    $scope.addAttachment(file);
                }
            }
        });

        // start timer ago
        $scope.agoTimer = $interval(function() {
            // Redirect to unlock view if the message is expired
            if ($scope.isExpired()) {
                $state.go('eo.unlock', {tag: $stateParams.tag});
            }
        }, 1000);

        $scope.$on('$destroy', function() {
            // cancel timer ago
            $interval.cancel($scope.agoTimer);
        });

    };

    /**
     * Determine if the message is expire
     */
    $scope.isExpired = function() {
        if (angular.isDefined($scope.message)) {
            return $scope.message.ExpirationTime < moment().unix();
        } else {
            return false;
        }
    };

    /**
     * Simulate click event on the input file
     */
    $scope.selectFile = function() {
        $('#inputFile').click();
    };

    /**
     * Reset input file
     */
    $scope.resetFile = function() {
        var element = $('#inputFile');

        element.wrap('<form>').closest('form').get(0).reset();
        element.unwrap();
    };

    /**
     * Send message
     */
    $scope.send = function() {
        var deferred = $q.defer();
        var publicKey = $scope.message.publicKey;
        embedded.parser($scope.message, 'cid')
        .then(function(result) {
            var bodyPromise = pmcw.encryptMessage(result, $scope.message.publicKey);
            var replyBodyPromise = pmcw.encryptMessage(result, [], password);

            $q.all({
                Body: bodyPromise,
                ReplyBody: replyBodyPromise
            })
            .then(
                function(result) {
                    var Filename = [];
                    var MIMEType = [];
                    var KeyPackets = [];
                    var DataPacket = [];
                    var attachments = $scope.message.Attachments || [];
                    var promises = attachments.map(function(attachment) {
                        var cid = embedded.getCid(attachment.Headers);

                        if (cid) {
                            return embedded.getBlob(cid).then((blob) => {
                                return Promise.resolve({
                                    Filename: attachment.Name,
                                    DataPacket: blob,
                                    MIMEType: attachment.MIMEType,
                                    KeyPackets: new Blob([attachment.KeyPackets]),
                                    Headers: attachment.Headers
                                });
                            });
                        } else {
                            return Promise.resolve({
                                Filename: attachment.Filename,
                                DataPacket: attachment.DataPacket,
                                MIMEType: attachment.MIMEType,
                                KeyPackets: attachment.KeyPackets
                            });
                        }
                    });

                    Promise.all(promises)
                    .then(function(attachments) {
                        attachments.forEach((attachment) => {
                            Filename.push(attachment.Filename);
                            DataPacket.push(attachment.DataPacket);
                            MIMEType.push(attachment.MIMEType);
                            KeyPackets.push(attachment.KeyPackets);
                        });

                        Eo.reply(decrypted_token, token_id, {
                            'Body': result.Body,
                            'ReplyBody': result.ReplyBody,
                            'Filename[]': Filename,
                            'MIMEType[]': MIMEType,
                            'KeyPackets[]': KeyPackets,
                            'DataPacket[]': DataPacket
                        })
                        .then(
                            function(result) {
                                $state.go('eo.message', {tag: $stateParams.tag});
                                notify({message: gettextCatalog.getString('Message sent', null), classes: 'notification-success'});
                                deferred.resolve(result);
                            },
                            function(error) {
                                error.message = gettextCatalog.getString('Error during the reply process', null, 'Error');
                                deferred.reject(error);
                            }
                        );
                    });
                },
                function(error) {
                    error.message = gettextCatalog.getString('Error during the encryption', null, 'Error');
                    deferred.reject(error);
                }
            );
        });

        return networkActivityTracker.track(deferred.promise);
    };

    $scope.cancel = function() {
        $state.go('eo.message', {tag: $stateParams.tag});
    };

    $scope.reply = function() {
        $state.go('eo.reply', {tag: $stateParams.tag});
    };

    $scope.toggleImages = function() {
        $scope.message.showImages = !$scope.message.showImages;
        $scope.message.setDecryptedBody(prepareContent($scope.message.getDecryptedBody(), $scope.message, ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']));
    };


    $scope.displayEmbedded = function() {
        message = $scope.message;
        message.showEmbedded = true;
        embedded
            .parser(message)
            .then((content) => {
                message.setDecryptedBody(content);
                $scope.message = message;
            });
    };


    $scope.addAttachment = function(file) {
        var totalSize = message.sizeAttachments();
        var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

        message.uploading = true;

        _.defaults(message, { Attachments: [] });

        if (angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
            notify({message: 'Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments', classes: 'notification-danger'});
            message.uploading = false;
            $scope.resetFile();
            // TODO remove file in droparea
        } else {
            totalSize += file.size;

            var attachmentPromise;
            var element = $(file.previewElement);

            if (totalSize < (sizeLimit * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE)) {
                var publicKey = $scope.message.publicKey;

                attachments.load(file, publicKey).then(function(packets) {
                    message.uploading = false;
                    $scope.resetFile();
                    message.Attachments.push({
                        Name: file.name,
                        Size: file.size,
                        Filename: packets.Filename,
                        MIMEType: packets.MIMEType,
                        KeyPackets: new Blob([packets.keys]),
                        DataPacket: new Blob([packets.data])
                    });
                    message.NumAttachments = message.Attachments.length;
                }, function(error) {
                    message.uploading = false;
                    $scope.resetFile();
                    notify({message: 'Error ', classes: 'notification-danger'});
                    $log.error(error);
                });
            } else {
                // Attachment size error.
                notify({message: 'Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/CONSTANTS.BASE_SIZE/CONSTANTS.BASE_SIZE)/10 + ' MB.', classes: 'notification-danger'});
                message.uploading = false;
                $scope.resetFile();
                // TODO remove file in droparea
            }
        }
    };

    $scope.decryptAttachment = function(attachment, $event) {

        $event.preventDefault();

        if ($state.includes('eo.reply')) {
            return;
        }

        var link = angular.element($event.target);
        var href = link.attr('href');

        if(href !== undefined && href.search(/^data.*/)!==-1) {
            alert("Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.");
            return false;
        }

        attachment.decrypting = true;

        // decode key packets
        var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

        // get enc attachment promise
        var att = Eo.attachment(decrypted_token, token_id, attachment.ID);

        // decrypt session key promise
        var key = pmcw.decryptSessionKey(keyPackets, password);

        // when we have the session key and attachent:
        $q.all({
            "attObject": att,
            "key": key
         }).then(
            function(obj) {
                // create new Uint8Array to store decryted attachment
                var at = new Uint8Array(obj.attObject.data);

                // grab the key
                var key = obj.key.key;

                // grab the algo
                var algo = obj.key.algo;

                // decrypt the att
                pmcw.decryptMessage(at, key, true, algo).then(
                    function(decryptedAtt) {
                        try {
                            $scope.downloadAttachment({
                                data: decryptedAtt.data,
                                Name: decryptedAtt.filename,
                                MIMEType: attachment.MIMEType,
                                el: $event.target
                            });
                            attachment.decrypting = false;
                            if(!$rootScope.isFileSaverSupported) {
                                // display a download icon
                                attachment.decrypted = true;
                            }
                            $scope.$apply();
                        } catch (error) {
                            $log.error(error);
                        }
                    },
                    function(error) {
                        $log.error(error);
                    }
                );
            },
            function(error) {
                $log.error(error);
            }
        );
    };

     $scope.downloadAttachment = function(attachment) {
        try {
            var blob = new Blob([attachment.data], {type: attachment.MIMEType});
            var link = $(attachment.el);

            if ($rootScope.isFileSaverSupported) {
                saveAs(blob, attachment.Name);
            } else {
                // Bad blob support, make a data URI, don't click it
                var reader = new FileReader();

                reader.onloadend = function () {
                    link.parent('a').attr('href',reader.result);
                };

                reader.readAsDataURL(blob);
            }
        } catch (error) {
            $log.error(error);
        }
    };

    $scope.removeAttachment = function(attachment) {
        $scope.message.Attachments = _.without(message.Attachments, attachment);
    };

    $scope.initialization();
});
