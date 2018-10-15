import { MAILBOX_IDENTIFIERS } from '../../constants';
import { combineHeaders, splitMail } from '../../../helpers/mail';

/* @ngInject */
function actionMessage(dispatchers, downloadFile, mimeMessageBuilder, networkActivityTracker, pgpModal, printModal) {
    const { dispatcher } = dispatchers(['messageActions']);
    const disp = (message = {}) => (action = '', mailbox = '') => {
        dispatcher.messageActions(action, {
            ids: [message.ID],
            labelID: MAILBOX_IDENTIFIERS[mailbox]
        });
    };

    const toggleImages = ({ message }) => {
        message.showEmbedded === true && (message.showEmbedded = false);
        message.showImages === true && (message.showImages = false);
    };

    /**
     * Exports the message to an EML file including attachments. Any encrypted headers in the body will overwrite the cleartext headers
     * @param scope
     */
    const downloadEML = (scope) => {
        const { Header = '', Subject = '', Time } = scope.message;
        const promise = mimeMessageBuilder
            .construct(scope.message, false)
            .then((mime) => {
                const { body, headers: mimeHeaders } = splitMail(mime);
                return combineHeaders(Header, mimeHeaders).then((headers) => [headers, body]);
            })
            .then(([headers, body]) => {
                const blob = new Blob([`${headers}\r\n${body}`], {
                    type: 'data:text/plain;charset=utf-8;'
                });
                const filename = `${Subject} ${moment.unix(Time).format()}.eml`;

                downloadFile(blob, filename);
            });

        networkActivityTracker.track(promise);
    };

    /**
     * Helper to get message content from the view
     * @param {String} message.MIMEType
     * @param {String} message.DecryptedBody
     * @param {Element} node
     * @return {String} content
     */
    const getMessageContent = ({ MIMEType = 'text/html', DecryptedBody }, node) => {
        if (MIMEType === 'text/plain') {
            return DecryptedBody;
        }
        return node
            .parents('.message')
            .get(0)
            .querySelector('.message-body-container').innerHTML;
    };

    return {
        link(scope, el, { actionMessage, actionMessageType = '' }) {
            const dispatch = disp(scope.message);
            function onClick() {
                switch (actionMessage) {
                    case 'unread':
                        scope.$applyAsync(() => {
                            scope.message.expand = false;
                            scope.message.Unread = 1;
                        });
                        dispatch(actionMessage, actionMessageType);
                        break;

                    case 'togglePlainHtml':
                        scope.$applyAsync(() => {
                            toggleImages(scope);
                            scope.message.viewMode = scope.message.viewMode === 'plain' ? 'html' : 'plain';
                        });
                        dispatch(actionMessage, actionMessageType);
                        break;

                    case 'toggleDetails':
                        scope.$applyAsync(() => {
                            scope.message.toggleDetails = !scope.message.toggleDetails;
                        });
                        break;

                    case 'print': {
                        printModal.activate({
                            params: {
                                type: 'message',
                                config: {
                                    message: scope.message,
                                    content: getMessageContent(scope.message, el)
                                },
                                cancel() {
                                    printModal.deactivate();
                                }
                            }
                        });
                        break;
                    }

                    case 'viewPgp': {
                        pgpModal.activate({
                            params: {
                                message: scope.message,
                                cancel() {
                                    pgpModal.deactivate();
                                }
                            }
                        });
                        break;
                    }

                    case 'downloadEml': {
                        downloadEML(scope);
                        break;
                    }

                    default:
                        dispatch(actionMessage, actionMessageType);
                        break;
                }
            }

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default actionMessage;
