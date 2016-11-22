angular.module('proton.controllers.Outside', ['proton.routes', 'proton.constants', 'proton.storage'])
.controller('OutsideController', (
    $interval,
    $q,
    $rootScope,
    $scope,
    $state,
    $sce,
    $stateParams,
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
    networkActivityTracker,
    secureSessionStorage,
    AttachmentLoader
) => {

    /**
     * @link {http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript}
     */
    function b64toBlob(b64Data = '', type = '', sliceSize = 512) {

        const byteCharacters = atob(b64Data);
        const size = byteCharacters.length;
        const byteArrays = [];

        for (let offset = 0; offset < size; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = _.map(new Array(slice.length), (e, i) => slice.charCodeAt(i));
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type });
    }

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

    function initialization() {
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
        });


        // start timer ago
        const agoTimer = $interval(() => {
            // Redirect to unlock view if the message is expired
            if (isExpired()) {
                $state.go('eo.unlock', { tag: $stateParams.tag });
            }
        }, 1000);

        $scope.$on('$destroy', () => {
            // cancel timer ago
            $interval.cancel(agoTimer);
        });
    }

    /**
     * Determine if the message is expire
     */
    function isExpired() {
        if ($scope.message) {
            return $scope.message.ExpirationTime < moment().unix();
        }
        return false;
    }

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

                    debugger;

                    if (cid && !attachment.DataPacket) {
                    //     return AttachmentLoader.get(attachment, message).then((buffer) => ({
                    //         CID: cid,
                    //         Filename: attachment.Name,
                    //         DataPacket: new Blob([buffer], { type: 'application/octet-stream' }),
                    //         MIMEType: attachment.MIMEType,
                    //         KeyPackets: b64toBlob(attachment.KeyPackets),
                    //         // KeyPackets: new Blob([attachment.KeyPackets]),
                    //         Headers: attachment.Headers
                    //     }));
                    //
                        attachment.Headers['content-id'] = cid.replace(/[<>]+/g, '');
                        const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

                        return embedded.getBlob(cid)
                            .then((blob) => {
                                const toFile = (blob, name) => {
                                    blob.inline = 1;
                                    blob.name = name;
                                    return blob;
                                };
                                return AttachmentLoader.load(toFile(blob, attachment.Name), message.publicKey)
                                    .then((packet) => ({
                                        CID: cid.replace(/[<>]+/g, ''),
                                        Filename: attachment.Name,
                                        MIMEType: attachment.MIMEType,
                                        Headers: attachment.Headers,
                                        KeyPackets: new Blob([packet.keys]),
                                        DataPacket: new Blob([packet.data])
                                    }));
                                // pmcw.encryptFile(keyPackets, message.publicKey, [], attachment.Name)
                                //     .then((packet) => ({
                                //         CID: cid.replace(/[<>]+/g, ''),
                                //         Filename: attachment.Name,
                                //         MIMEType: attachment.MIMEType,
                                //         Headers: attachment.Headers,
                                //         KeyPackets: new Blob([packet.keys]),
                                //         DataPacket: new Blob([packet.data])
                                //     }));

                                // return {
                                //     CID: cid.replace(/[<>]+/g, ''),
                                //     Filename: attachment.Name,
                                //     DataPacket: blob,
                                //     MIMEType: attachment.MIMEType,
                                //     // KeyPackets: attachment.KeyPackets || ,
                                //     // KeyPackets: new Blob([attachment.KeyPackets]),
                                //     KeyPackets: new Blob([keyPackets]),
                                //     // KeyPackets: b64toBlob(attachment.KeyPackets),
                                //     Headers: attachment.Headers
                                // };
                            });
                    }
                    return Promise.resolve({
                        CID: cid.replace(/[<>]+/g, ''),
                        Filename: attachment.Filename,
                        DataPacket: attachment.DataPacket,
                        MIMEType: attachment.MIMEType,
                        KeyPackets: attachment.KeyPackets,
                        Headers: attachment.Headers
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
                            notify({ message: gettextCatalog.getString('Error during the reply process', null, 'Error'), classes: 'notification-danger' });
                            deferred.reject(error);
                        });
                    });
            })
            .catch((error) => {
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

    initialization();
});
