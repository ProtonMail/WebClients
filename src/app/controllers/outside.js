angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    Attachment,
    CONSTANTS,
    Eo,
    Message,
    attachments,
    authentication,
    message,
    notify,
    pmcw,
    tools,
    networkActivityTracker
) {
    // Variables
    var decrypted_token = window.sessionStorage["proton:decrypted_token"];
    var password = pmcw.decode_utf8_base64(window.sessionStorage["proton:encrypted_password"]);
    var token_id = $stateParams.tag;

    $scope.message = message;

    if(message.displayMessage === true) {
        $timeout(function() {
            $scope.message.Body = $scope.clean($scope.message.Body);
            $scope.containsImage = tools.containsImage($scope.message.Body);
            _.each($scope.message.Replies, function(reply) {
                reply.Body = $scope.clean(reply.Body);
            });
        });
    }

    $timeout(function() {
        $('#inputFile').change(function(event) {
            event.preventDefault();

            var files = $('#inputFile')[0].files;

            for(var i = 0; i<files.length; i++) {
                $scope.addAttachment(files[i]);
            }

        });
    }, 100);

    // start timer ago
    $scope.agoTimer = $interval(function() {
        // Redirect to unlock view if the message is expired
        if($scope.isExpired()) {
            $state.go('eo.unlock', {tag: $stateParams.tag});
        }
    }, 1000);

    $scope.$on('$destroy', function() {
        // cancel timer ago
        $interval.cancel($scope.agoTimer);
    });

    /**
     * Determine if the message is expire
     */
    $scope.isExpired = function() {
        return $scope.message.ExpirationTime < moment().unix();
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
        var bodyPromise = pmcw.encryptMessage($scope.message.Body, $scope.message.publicKey);
        var replyBodyPromise = pmcw.encryptMessage($scope.message.Body, [], password);

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

                _.each($scope.message.Attachments, function(attachment) {
                    Filename.push(attachment.Filename);
                    MIMEType.push(attachment.MIMEType);
                    KeyPackets.push(attachment.KeyPackets);
                    DataPacket.push(attachment.DataPacket);
                });

                var data = {
                    'Body': result.Body,
                    'ReplyBody': result.ReplyBody,
                    'Filename[]': Filename,
                    'MIMEType[]': MIMEType,
                    'KeyPackets[]': KeyPackets,
                    'DataPacket[]': DataPacket
                };

                Eo.reply(decrypted_token, token_id, data)
                .then(
                    function(result) {
                        $state.go('eo.message', {tag: $stateParams.tag});
                        notify({message: $translate.instant('MESSAGE_SENT'), classes: 'notification-success'});
                        deferred.resolve(result);
                    },
                    function(error) {
                        error.message = 'Error during the reply process'; // TODO send to back-end
                        deferred.reject(error);
                    }
                );
            },
            function(error) {
                error.message = 'Error during the encryption'; // TODO send to back-end
                deferred.reject(error);
            }
        );

        return networkActivityTracker.track(deferred.promise);
    };

    $scope.cancel = function() {
        $state.go('eo.message', {tag: $stateParams.tag});
    };


    $scope.clean = function(body) {
        var content = angular.copy(body);

        content = tools.clearImageBody(content);
        $scope.message.imagesHidden = true;
        content = DOMPurify.sanitize(content, {
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['style', 'input', 'form']
        });

        return content;
    };

    $scope.reply = function() {
        $state.go('eo.reply', {tag: $stateParams.tag});
    };

    $scope.toggleImages = function() {
        if($scope.message.imagesHidden === true) {
            $scope.message.Body = tools.fixImages($scope.message.Body);
            $scope.message.imagesHidden = false;
        } else {
            $scope.message.Body = tools.breakImages($scope.message.Body);
            $scope.message.imagesHidden = true;
        }
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
                                $($event.currentTarget).prepend('<span class="fa fa-download"></span>');
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

            if($rootScope.isFileSaverSupported) {
                saveAs(blob, attachment.Name);
            } else {
                // Bad blob support, make a data URI, don't click it
                var reader = new FileReader();

                reader.onloadend = function () {
                    link.attr('href',reader.result);
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
});
