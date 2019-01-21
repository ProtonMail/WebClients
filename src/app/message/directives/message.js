import _ from 'lodash';

import { MESSAGE_FLAGS, SEND_TYPES } from '../../constants';
import displaySignatureStatus from '../../../helpers/displaySignatureStatus';
import { isDraft, isSent, isReplied, isRepliedAll, isForwarded } from '../../../helpers/message';

const { FLAG_INTERNAL } = MESSAGE_FLAGS;

const CLASSNAME = {
    UNDISCLOSED: 'message-undisclosed'
};

/* @ngInject */
function message(
    $state,
    dispatchers,
    mailSettingsModel,
    cache,
    displayContent,
    messageScroll,
    tools,
    unsubscribeModel,
    sendPreferences,
    $exceptionHandler,
    recipientsFormator
) {
    const noRecipients = (message) => !recipientsFormator.toList(message).length;

    /**
     * Back to element list
     */
    function back() {
        const route = $state.$current.name.replace('.element', '');
        $state.go(route, { id: null });
    }

    /**
     * Check if the message can be open for the current context
     * @param  {Array}  [LabelIDs=[]}]
     * @return {Boolean}
     */
    function canBeOpen({ LabelIDs = [] }) {
        const currentLocation = tools.currentLocation();
        const condition = LabelIDs.indexOf(currentLocation) !== -1;
        const type = tools.typeView();
        const isSearch = $state.includes('secured.search.**');
        return type === 'conversation' || isSearch || condition;
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/message/message.tpl.html'),
        scope: {
            message: '=model',
            marked: '=',
            last: '=',
            index: '='
        },
        link(scope, element) {
            const { on, dispatcher, unsubscribe } = dispatchers(['messageActions', 'composer.load', 'tooltip']);

            scope.getClassNames = (message = {}, marked = {}) => {
                const { Address = [] } = message.Sender || {};
                const hasSender = Address.length;

                return {
                    hasSender,
                    open: message.expand,
                    marked: message.ID === marked.ID,
                    unread: message.Unread === 1,
                    details: message.toggleDetails === true,
                    draft: isDraft(message),
                    sent: isSent(message),
                    'message-is-replied': isReplied(message),
                    'message-is-repliedall': isRepliedAll(message),
                    'message-is-forwarded': isForwarded(message),
                    'message-mode-plain': message.viewMode === 'plain'
                };
            };

            const bindClasses = (message) => {
                element[0].classList[noRecipients(message) ? 'add' : 'remove'](CLASSNAME.UNDISCLOSED);
            };

            bindClasses(scope.message);

            const loadMessageBody = () => {
                return cache.getMessage(scope.message.ID).then((message) => _.extend(scope.message, message));
            };

            const reloadEncryptionTooltip = () => {
                dispatcher.tooltip('reloadEncryptionTooltip', { message: scope.message });
            };

            const updateMessage = async (promise) => {
                // must be done when actually loading the message so we don't fetch this info for each message in the conversation
                // (otherwise causes sendPreferences to fetch all keys from the keyapi.
                sendPreferences
                    .get([scope.message.SenderAddress])
                    .then(({ [scope.message.SenderAddress]: { pinned, scheme, isVerified } }) =>
                        scope.$applyAsync(() => {
                            const isInternal = scheme === SEND_TYPES.SEND_PM;
                            isInternal && scope.message.addFlag(FLAG_INTERNAL);
                            scope.message.promptKeyPinning =
                                !pinned && mailSettingsModel.get('PromptPin') && isInternal;
                            scope.message.askResign = pinned && !isVerified;
                        })
                    );
                try {
                    const { type, body } = await promise;
                    scope.$applyAsync(() => {
                        scope.message.expand = true;
                        scope.message.isPlain = type === 'plain';
                        if (type && body) {
                            scope.message.viewMode = 'html';
                            scope.body = body;
                        }
                        reloadEncryptionTooltip();

                        const allowed = [
                            'none',
                            'pgp-mime',
                            'pgp-mime-pinned',
                            'pgp-inline',
                            'pgp-inline-pinned',
                            'pgp-eo',
                            'pgp-pm',
                            'pgp-pm-pinned'
                        ];
                        const parseRecipientHeader = (header, recipients) => {
                            const pairs = header.split(';').map((s) =>
                                decodeURIComponent(s)
                                    .trim()
                                    .split('=')
                            );
                            const map = _.fromPairs(pairs);
                            const defaults = _.zipObject(recipients, Array(recipients.length).fill('none'));
                            return _.extend(
                                defaults,
                                _.mapValues(map, (val) => (allowed.includes(val) ? val : 'none'))
                            );
                        };

                        const parsedHeaders = scope.message.getParsedHeaders();
                        const recipients = _.map(recipientsFormator.toList(scope.message), 'Address');

                        const encryptionList = parseRecipientHeader(
                            parsedHeaders['X-Pm-Recipient-Encryption'] || '',
                            recipients
                        );
                        const authenticationList = parseRecipientHeader(
                            parsedHeaders['X-Pm-Recipient-Authentication'] || '',
                            recipients
                        );

                        const addCryptoInfo = (item) => ({
                            ...item,
                            ...(!item.isContactGroup && {
                                Authentication: authenticationList[item.Address],
                                Encryption: encryptionList[item.Address]
                            })
                        });

                        scope.toList = scope.message.ToList.map(addCryptoInfo);
                        scope.ccList = scope.message.CCList.map(addCryptoInfo);
                        scope.bccList = scope.message.BCCList.map(addCryptoInfo);
                    });
                } catch (e) {
                    console.error(e);
                    $exceptionHandler(e);
                    scope.$applyAsync(() => {
                        scope.message.expand = true;
                        scope.message.viewMode = 'plain';
                        scope.message.hasError = true;
                        scope.message.errorInfo = e;
                    });
                }
            };

            const loadContent = () => updateMessage(displayContent(scope.message, scope.body, scope.index));

            /**
             * Initialize the message
             */
            scope.body = ''; // Here we put the content displayed inside the message content
            scope.unsubscribed = unsubscribeModel.already(scope.message.getListUnsubscribe());
            (scope.message.openMe || scope.message.expand) && openMessage();

            const addDefaults = (email) => ({
                ...email,
                Authentication: 'none',
                Encryption: 'none'
            });
            scope.toList = scope.message.ToList.map(addDefaults);
            scope.ccList = scope.message.CCList.map(addDefaults);
            scope.bccList = scope.message.BCCList.map(addDefaults);

            scope.displaySignatureStatus = displaySignatureStatus(scope.message);

            scope.message.promptKeyPinning = false;

            on('message.open', (e, { type, data }) => {
                if (data.message.ID !== scope.message.ID) {
                    return;
                }

                switch (type) {
                    case 'toggle':
                        openMessage(data);

                        // Coming from hotkeys or toggle
                        if (data.action) {
                            return messageScroll.to({
                                index: scope.index,
                                message: scope.message,
                                node: element[0]
                            });
                        }

                        break;

                    case 'embedded.injected':
                        if (!data.action) {
                            scope.$applyAsync(() => (scope.body = data.body));
                        }
                        break;

                    case 'save.success':
                        if ($state.includes('secured.allDrafts.**')) {
                            return $state.go('secured.allDrafts');
                        }

                        if ($state.includes('secured.drafts.**')) {
                            return $state.go('secured.drafts');
                        }

                        openMessage();
                        break;
                }
            });

            on('message', (event, { type = '', data = {} }) => {
                if (type === 'unsubscribed' && data.message.ID === scope.message.ID) {
                    scope.$applyAsync(() => {
                        scope.unsubscribed = unsubscribeModel.already(scope.message.getListUnsubscribe());
                    });
                }
                if (type === 'decrypted' && data.message.ID === scope.message.ID) {
                    reloadEncryptionTooltip();
                }
                if (type === 'reload' && scope.message.Body && data.conversationID === scope.message.ConversationID) {
                    scope.message.clearTextBody(true).then(() => scope.$applyAsync());
                }
            });

            on('message.refresh', async (event, { data: messageIDs }) => {
                if (messageIDs.indexOf(scope.message.ID) > -1) {
                    const message = cache.getMessageCached(scope.message.ID);
                    const type = tools.typeView();

                    if (message && canBeOpen(message)) {
                        if (message.isMIME()) {
                            // we need to reload the attachments too: otherwise the attachments disappear from the message
                            await message.loadPGPAttachments();
                        }
                        scope.message = _.extend(scope.message, message);
                        bindClasses(scope.message);
                    } else if (type === 'message') {
                        back();
                    }
                }
            });

            function openMessage({ expand } = {}) {
                if (scope.message.isDraft()) {
                    if ($state.includes('secured.drafts.**') || $state.includes('secured.allDrafts.**')) {
                        dispatcher['composer.load']('', scope.message);
                    }
                    return;
                }

                // Default there is no expand, this key is coming from toggleMessage
                if (expand === false) {
                    // Default are undefined, only bind the value if they were set.
                    _.has(scope.message, 'showEmbedded') && (scope.message.showEmbedded = false);
                    _.has(scope.message, 'showImages') && (scope.message.showImages = false);
                    return;
                }

                const promise = typeof scope.message.Body === 'undefined' ? loadMessageBody() : Promise.resolve();

                promise.then(loadContent).then(() => {
                    // Auto focus message list when we load the message, to allow keyboard srolling
                    scope.$applyAsync(() => {
                        // If you switch to another conversation the container might not exist
                        $(document.getElementById('pm_thread')).focus();
                    });
                });
            }

            /**
             * Used for dropdown-folders, return the current message model inside an array
             * @return {Array}
             */
            scope.getElements = () => [scope.message];

            /**
             * Get all recipients
             * @return {Array} recipients
             */
            scope.recipients = () => {
                return scope.message.ToList.concat(scope.message.CCList, scope.message.BCCList);
            };

            /**
             * Check if there is no recipients
             * @return {Boolean}
             */
            scope.noRecipients = () => noRecipients(scope.message);

            // TODO need review with label dropdown
            scope.getMessage = () => [scope.message];

            /**
             * Method call when the user submit some labels to apply to this message
             * @param {Array} labels
             * @param {Boolean} alsoArchive
             */
            scope.saveLabels = (labels, alsoArchive) => {
                const messages = [scope.message];
                dispatcher.messageActions('label', { messages, labels, alsoArchive });
            };

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default message;
