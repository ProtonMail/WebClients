angular.module('proton.outside')
.controller('OutsideController', (
    $interval,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    gettextCatalog,
    CONSTANTS,
    Eo,
    embedded,
    Message,
    prepareContent,
    messageData,
    notify,
    pmcw,
    networkActivityTracker,
    secureSessionStorage,
    attachmentModelOutside
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
        const { Replies = [] } = $scope.message;

        if (Replies.length >= CONSTANTS.MAX_OUTSIDE_REPLY) {
            const message = gettextCatalog.getString("ProtonMail's Encrypted Outside feature only allows replying 5 times. <a href=\"https://protonmail.com/signup\" target=\"_blank\">You can sign up for ProtonMail for seamless and unlimited end-to-end encryption</a>.", null, 'Notification');
            notify({ message });
        }

        const process = embedded.parser($scope.message, 'cid')
            .then((result) => Promise.all([
                pmcw.encryptMessage(result, $scope.message.publicKey),
                pmcw.encryptMessage(result, [], password),
                attachmentModelOutside.encrypt($scope.message)
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
            ]))
            .then(([ Body, ReplyBody, Packages ]) => {
                return Eo.reply(decryptedToken, tokenId, {
                    Body, ReplyBody,
                    'Filename[]': Packages.Filename,
                    'MIMEType[]': Packages.MIMEType,
                    'KeyPackets[]': Packages.KeyPackets,
                    'ContentID[]': Packages.ContentID,
                    'DataPacket[]': Packages.DataPacket
                })
                .then((result) => {
                    $state.go('eo.message', { tag: $stateParams.tag });
                    notify({ message: gettextCatalog.getString('Message sent', null), classes: 'notification-success' });
                    return result;
                })
                .catch((err) => {
                    notify({ message: gettextCatalog.getString('Error during the reply process', null, 'Error'), classes: 'notification-danger' });
                    throw err;
                });
            }).catch((error) => {
                error.message = gettextCatalog.getString('Error during the encryption', null, 'Error');
            });

        return networkActivityTracker.track(process);
    };

    $scope.cancel = () => {
        $state.go('eo.message', { tag: $stateParams.tag });
    };

    $scope.reply = () => {
        $state.go('eo.reply', { tag: $stateParams.tag });
    };

    initialization();
});
