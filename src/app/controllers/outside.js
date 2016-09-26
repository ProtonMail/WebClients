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
    CONSTANTS,
    Eo,
    embedded,
    Message,
    authentication,
    prepareContent,
    message,
    notify,
    pmcw,
    tools,
    networkActivityTracker,
    AttachmentLoader,
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

    function watchInput() {
        const ATTACHMENT_MAX_SIZE = CONSTANTS.ATTACHMENT_SIZE_LIMIT * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE;

        // Add a delay to detect the input as it might not be availabled
        const id = setTimeout(() => {
            $('#inputFile').change((e) => {
                e.preventDefault();
                const files = e.target.files;

                const totalSize = _.reduce(files, (acc, file) => acc + file.size, 0);
                const totalSizeAtt = message.attachmentsSize();

                if ((totalSize + totalSizeAtt) > ATTACHMENT_MAX_SIZE) {
                    return notify({message: 'Attachments are limited to ' + CONSTANTS.ATTACHMENT_SIZE_LIMIT + ' MB.', classes: 'notification-danger'});
                }
                _.each(files, addAttachment);

            });
            clearTimeout(id);
        }, 500);
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
            watchInput();
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

    $scope.isEmbedded = (attachment) => {
        return embedded.isEmbedded(attachment);
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
                const body = prepareContent(content, message, ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']);
                message.setDecryptedBody(body);
                $scope.message = message;
            });
    };


    function addAttachment(file) {
        var totalSize = message.attachmentsSize();
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

            if (totalSize < (sizeLimit * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE)) {
                var publicKey = $scope.message.publicKey;

                AttachmentLoader.load(file, publicKey).then(function(packets) {
                    message.uploading = false;
                    $scope.resetFile();

                    // The id is for the front only and the BE ignores it
                    message.Attachments.push({
                        ID: `att_${Math.random().toString(32).slice(0,12)}_${Date.now()}`,
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
    }

    $scope.initialization();
});
