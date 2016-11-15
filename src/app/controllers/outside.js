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
    const message = messageData;

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

    $scope.initialization = () => {
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
            message.expand = true;
            message.From = {
                Keys: [{ PublicKey: message.publicKey }]
            };
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
    $scope.isExpired = () => {
        if (angular.isDefined($scope.message)) {
            return $scope.message.ExpirationTime < moment().unix();
        }

        return false;
    };

    /**
     * Simulate click event on the input file
     */
    $scope.selectFile = () => {
        $('#inputFile').click();
    };

    /**
     * Reset input file
     */
    $scope.resetFile = () => {
        const element = $('#inputFile');

        element.wrap('<form>').closest('form').get(0).reset();
        element.unwrap();
    };
    /**
     * Send message
     */
    $scope.send = () => {
        const deferred = $q.defer();
        const { Replies = [] } = $scope.message;

        if (Replies.length >= CONSTANTS.MAX_OUTSIDE_REPLY) {
            const message = gettextCatalog.getString("ProtonMail's Encrypted Outside feature only allows replying 5 times. <a href=\"https://protonmail.com/signup\" target=\"_blank\">You can sign up for ProtonMail for seamless and unlimited end-to-end encryption</a>.", null, 'Notification');
            notify({ message });
        }

        embedded.parser($scope.message, 'cid')
            .then((result) => {
                const bodyPromise = pmcw.encryptMessage(result, $scope.message.publicKey);
                const replyBodyPromise = pmcw.encryptMessage(result, [], password);
                return $q.all({ Body: bodyPromise, ReplyBody: replyBodyPromise });
            })
            .then(({ Body, ReplyBody }) => {

                const attachments = $scope.message.Attachments || [];
                const promises = attachments.map((attachment) => {
                    const cid = embedded.getCid(attachment.Headers);
                    if (cid) {
                        return embedded.getBlob(cid)
                            .then((blob) => ({
                                CID: cid,
                                Filename: attachment.Name,
                                DataPacket: blob,
                                MIMEType: attachment.MIMEType,
                                KeyPackets: new Blob([attachment.KeyPackets]),
                                Headers: attachment.Headers
                            }));
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
                        return attachments.reduce((acc, { Filename, DataPacket, MIMEType, KeyPackets, CID = '' }) => {
                            acc.Filename.push(Filename);
                            acc.DataPacket.push(DataPacket);
                            acc.MIMEType.push(MIMEType);
                            acc.KeyPackets.push(KeyPackets);
                            acc.ContentID.push(CID);
                            return acc;
                        }, { Filename: [], DataPacket: [], MIMEType: [], KeyPackets: [], ContentID: [] });
                    })
                    .then(({ Filename, MIMEType, KeyPackets, ContentID, DataPacket }) => {
                        Eo.reply(decryptedToken, tokenId, {
                            Body, ReplyBody,
                            'Filename[]': Filename,
                            'MIMEType[]': MIMEType,
                            'KeyPackets[]': KeyPackets,
                            'ContentID[]': ContentID,
                            'DataPacket[]': DataPacket
                        })
                        .then((result) => {
                            $state.go('eo.message', { tag: $stateParams.tag });
                            notify({ message: gettextCatalog.getString('Message sent', null), classes: 'notification-success' });
                            deferred.resolve(result);
                        })
                        .catch((error) => {
                            console.error(error);
                            error.message = gettextCatalog.getString('Error during the reply process', null, 'Error');
                            deferred.reject(error);
                        });
                    });
            })
            .catch((error) => {
                console.error(error);
                error.message = gettextCatalog.getString('Error during the encryption', null, 'Error');
                deferred.reject(error);
            });

        return networkActivityTracker.track(deferred.promise);
    };

    $scope.cancel = () => {
        $state.go('eo.message', { tag: $stateParams.tag });
    };

    $scope.reply = () => {
        $state.go('eo.reply', { tag: $stateParams.tag });
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
