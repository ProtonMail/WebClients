import _ from 'lodash';
import { MIME_TYPES, MAX_OUTSIDE_REPLY } from '../../constants';

const { DEFAULT } = MIME_TYPES;

/* @ngInject */
function OutsideController(
    $interval,
    $scope,
    $state,
    $stateParams,
    gettextCatalog,
    Eo,
    embedded,
    prepareContent,
    messageData,
    notification,
    pmcw,
    textToHtmlMail,
    networkActivityTracker,
    secureSessionStorage,
    attachmentModelOutside,
    sanitize
) {
    const I18N = {
        SUCCESS: gettextCatalog.getString('Message sent', null, 'Success'),
        OUTSIDE_REPLY_ERROR: gettextCatalog.getString(
            'ProtonMail\'s Encrypted Outside feature only allows replying 5 times. <a href="https://protonmail.com/signup" target="_blank">You can sign up for ProtonMail for seamless and unlimited end-to-end encryption</a>.',
            null,
            'Notification'
        ),
        ENCRYPTION_ERROR: gettextCatalog.getString('Error encrypting message', null, 'Error')
    };

    attachmentModelOutside.load();
    const decryptedToken = secureSessionStorage.getItem('proton:decrypted_token');
    const password = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
    const tokenId = $stateParams.tag;
    const message = messageData;

    function clean(body) {
        let content = sanitize.message(body);

        if ($state.is('eo.reply')) {
            content = `<br /><br /><blockquote class="protonmail_quote" type="cite">${content}</blockquote>`;
        }

        return prepareContent(content, message);
    }

    const plaintextToHTML = (plaintext) => {
        return $state.is('eo.reply')
            ? textToHtmlMail.parse(plaintext)
            : $('<div>')
                  .html(plaintext)
                  .text();
    };

    function initialization() {
        if (message.isPlainText()) {
            message.setDecryptedBody(plaintextToHTML(message.getDecryptedBody()));
        }

        if ($state.is('eo.reply')) {
            message.showImages = true;
            message.showEmbedded = true;
            message.MIMEType = DEFAULT;
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
            $scope.isPlain = message.isPlainText();
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

        if (Replies.length >= MAX_OUTSIDE_REPLY) {
            const message = I18N.OUTSIDE_REPLY_ERROR;
            notification.info(message);
        }
        const process = Promise.all([
            embedded.parser($scope.message, { direction: 'cid' }),
            pmcw.getKeys($scope.message.publicKey)
        ])
            .then(([data, publicKeys]) =>
                Promise.all([
                    pmcw.encryptMessage({ data, publicKeys }),
                    pmcw.encryptMessage({ data, passwords: password }),
                    attachmentModelOutside.encrypt($scope.message).then((attachments) => {
                        return attachments.reduce(
                            (acc, { Filename, DataPacket, MIMEType, KeyPackets, CID = '' }) => {
                                acc.Filename.push(Filename);
                                acc.DataPacket.push(DataPacket);
                                acc.MIMEType.push(MIMEType);
                                acc.KeyPackets.push(KeyPackets);
                                acc.ContentID.push(CID);
                                return acc;
                            },
                            { Filename: [], DataPacket: [], MIMEType: [], KeyPackets: [], ContentID: [] }
                        );
                    })
                ]).catch(() => {
                    // Override any encryption error above with this.
                    throw new Error(I18N.ENCRYPTION_ERROR);
                })
            )
            .then(([{ data: Body }, { data: ReplyBody }, Packages]) => {
                return Eo.reply(decryptedToken, tokenId, {
                    Body,
                    ReplyBody,
                    'Filename[]': Packages.Filename,
                    'MIMEType[]': Packages.MIMEType,
                    'KeyPackets[]': Packages.KeyPackets,
                    'ContentID[]': Packages.ContentID,
                    'DataPacket[]': Packages.DataPacket
                });
            })
            .then((result) => {
                $state.go('eo.message', { tag: $stateParams.tag });
                notification.success(I18N.SUCCESS);
                return result;
            });

        return networkActivityTracker.track(process);
    };

    $scope.cancel = () => {
        $state.go('eo.message', { tag: $stateParams.tag });
    };

    $scope.reply = () => {
        $state.go('eo.reply', {
            tag: $stateParams.tag,
            showImages: message.showImages
        });
    };

    initialization();
}
export default OutsideController;
