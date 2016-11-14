angular.module('proton.controllers.Outside', [
    'proton.routes',
    'proton.constants',
    'proton.storage'
])

.controller('OutsideController', (
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
    messageData,
    notify,
    pmcw,
    tools,
    networkActivityTracker,
    AttachmentLoader,
    secureSessionStorage
) => {
    // Variables
    const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
    const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
    const tokenId = $stateParams.tag;
    let message = messageData;

    function clean(body) {
        let content = angular.copy(body);

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
                    return notify({ message: 'Attachments are limited to ' + CONSTANTS.ATTACHMENT_SIZE_LIMIT + ' MB.', classes: 'notification-danger' });
                }
                _.each(files, addAttachment);

            });
            clearTimeout(id);
        }, 500);
    }

    $scope.initialization = function () {
        if ($state.is('eo.reply')) {
            message.showImages = true;
            message.showEmbedded = true;
        }

        message.setDecryptedBody(clean(message.getDecryptedBody()));

        if ($state.is('eo.message')) {
            _.each(message.Replies, (reply) => {
                reply.Body = clean(reply.Body);
            });
        }

        embedded.parser(message).then((result) => {
            message.setDecryptedBody(result);
            $scope.message = message;
            $scope.body = message.getDecryptedBody();
            watchInput();
        });


        // start timer ago
        $scope.agoTimer = $interval(() => {
            // Redirect to unlock view if the message is expired
            if ($scope.isExpired()) {
                $state.go('eo.unlock', { tag: $stateParams.tag });
            }
        }, 1000);

        $scope.$on('$destroy', () => {
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
    $scope.isExpired = function () {
        if (angular.isDefined($scope.message)) {
            return $scope.message.ExpirationTime < moment().unix();
        }

        return false;
    };

    /**
     * Simulate click event on the input file
     */
    $scope.selectFile = function () {
        $('#inputFile').click();
    };

    /**
     * Reset input file
     */
    $scope.resetFile = function () {
        const element = $('#inputFile');

        element.wrap('<form>').closest('form').get(0).reset();
        element.unwrap();
    };

    /**
     * Send message
     */
    $scope.send = function () {
        const deferred = $q.defer();

        embedded
        .parser($scope.message, 'cid')
        .then((result) => {
            const bodyPromise = pmcw.encryptMessage(result, $scope.message.publicKey);
            const replyBodyPromise = pmcw.encryptMessage(result, [], password);

            $q.all({
                Body: bodyPromise,
                ReplyBody: replyBodyPromise
            })
            .then(
                (result) => {
                    const Filename = [];
                    const MIMEType = [];
                    const KeyPackets = [];
                    const DataPacket = [];
                    const attachments = $scope.message.Attachments || [];
                    const promises = attachments.map((attachment) => {
                        const cid = embedded.getCid(attachment.Headers);

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
                        }

                        return Promise.resolve({
                            Filename: attachment.Filename,
                            DataPacket: attachment.DataPacket,
                            MIMEType: attachment.MIMEType,
                            KeyPackets: attachment.KeyPackets
                        });
                    });

                    Promise.all(promises)
                    .then((attachments) => {
                        attachments.forEach((attachment) => {
                            Filename.push(attachment.Filename);
                            DataPacket.push(attachment.DataPacket);
                            MIMEType.push(attachment.MIMEType);
                            KeyPackets.push(attachment.KeyPackets);
                        });

                        Eo.reply(decryptedToken, tokenId, {
                            Body: result.Body,
                            ReplyBody: result.ReplyBody,
                            'Filename[]': Filename,
                            'MIMEType[]': MIMEType,
                            'KeyPackets[]': KeyPackets,
                            'DataPacket[]': DataPacket
                        })
                        .then(
                            (result) => {
                                $state.go('eo.message', { tag: $stateParams.tag });
                                notify({ message: gettextCatalog.getString('Message sent', null), classes: 'notification-success' });
                                deferred.resolve(result);
                            },
                            (error) => {
                                error.message = gettextCatalog.getString('Error during the reply process', null, 'Error');
                                deferred.reject(error);
                            }
                        );
                    });
                },
                (error) => {
                    error.message = gettextCatalog.getString('Error during the encryption', null, 'Error');
                    deferred.reject(error);
                }
            );
        });

        return networkActivityTracker.track(deferred.promise);
    };

    $scope.cancel = function () {
        $state.go('eo.message', { tag: $stateParams.tag });
    };

    $scope.reply = function () {
        $state.go('eo.reply', { tag: $stateParams.tag });
    };

    $scope.toggleImages = function () {
        $scope.message.showImages = !$scope.message.showImages;
        $scope.message.setDecryptedBody(prepareContent($scope.message.getDecryptedBody(), $scope.message, {
            blacklist: ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']
        }));
    };


    $scope.displayEmbedded = function () {
        message = $scope.message;
        message.showEmbedded = true;
        embedded
            .parser(message)
            .then((content) => {
                const body = prepareContent(content, message, {
                    blacklist: ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']
                });
                message.setDecryptedBody(body);
                $scope.message = message;
            });
    };


    function addAttachment(file) {
        let totalSize = message.attachmentsSize();
        const sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

        message.uploading = true;

        _.defaults(message, { Attachments: [] });

        if (angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
            notify({ message: 'Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments', classes: 'notification-danger' });
            message.uploading = false;
            $scope.resetFile();
            // TODO remove file in droparea
        } else {
            totalSize += file.size;

            if (totalSize < (sizeLimit * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE)) {
                const publicKey = $scope.message.publicKey;

                AttachmentLoader.load(file, publicKey).then((packets) => {
                    message.uploading = false;
                    $scope.resetFile();

                    // The id is for the front only and the BE ignores it
                    message.Attachments.push({
                        ID: `att_${Math.random().toString(32).slice(0, 12)}_${Date.now()}`,
                        Name: file.name,
                        Size: file.size,
                        Filename: packets.Filename,
                        MIMEType: packets.MIMEType,
                        KeyPackets: new Blob([packets.keys]),
                        DataPacket: new Blob([packets.data])
                    });
                    message.NumAttachments = message.Attachments.length;
                    $rootScope.$emit('attachmentAdded');
                }, (error) => {
                    message.uploading = false;
                    $scope.resetFile();
                    notify({ message: 'Error ', classes: 'notification-danger' });
                    $log.error(error);
                });
            } else {
                // Attachment size error.
                notify({ message: 'Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10 * totalSize / CONSTANTS.BASE_SIZE / CONSTANTS.BASE_SIZE) / 10 + ' MB.', classes: 'notification-danger' });
                message.uploading = false;
                $scope.resetFile();
                // TODO remove file in droparea
            }
        }
    }

    $scope.initialization();
});
