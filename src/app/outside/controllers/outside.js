import _ from 'lodash';
import { encryptMessage, getKeys } from 'pmcrypto';

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
    textToHtmlMail,
    networkActivityTracker,
    eoStore,
    attachmentModelOutside,
    dispatchers,
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

    const { dispatcher, on, unsubscribe } = dispatchers(['composer.update', 'editorListener']);

    attachmentModelOutside.load();
    const decryptedToken = eoStore.getToken();
    const password = eoStore.getPassword();
    const tokenId = $stateParams.tag;
    const message = messageData;

    function clean(body) {
        let content = sanitize.message(body);

        if ($state.is('eo.reply')) {
            content = `<br /><br /><blockquote class="protonmail_quote" type="cite">${content}</blockquote>`;
        }

        // No need to add the read more here as we will sanitize it later and it will classes
        return prepareContent(content, message, {
            blacklist: ['transformBlockquotes']
        });
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

            // apply transformation to add the blockquote
            $scope.body = prepareContent(message.getDecryptedBody(), message, {
                blacklist: ['*'],
                whitelist: ['transformBlockquotes']
            });
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
        dispatcher.editorListener('pre.send.message', { message: $scope.message });
    };

    const send = (message) => {
        const { Replies = [] } = message;

        if (Replies.length >= MAX_OUTSIDE_REPLY) {
            const message = I18N.OUTSIDE_REPLY_ERROR;
            notification.info(message);
        }
        const process = Promise.all([embedded.parser(message, { direction: 'cid' }), getKeys(message.publicKey)])
            .then(([data, publicKeys]) =>
                Promise.all([
                    encryptMessage({ data, publicKeys }),
                    encryptMessage({ data, passwords: password }),
                    attachmentModelOutside.encrypt(message).then((attachments) => {
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

    on('composer.update', (e, { type, data }) => {
        if (type === 'send.message') {
            send(data.message);
        }
    });

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

    $scope.$on('$destroy', unsubscribe);
}
export default OutsideController;
