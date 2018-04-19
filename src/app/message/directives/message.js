import _ from 'lodash';

import { SEND_TYPES, ENCRYPTED_STATUS } from '../../constants';

const CLASSNAME = {
    UNDISCLOSED: 'message-undisclosed'
};
const getRecipients = ({ ToList = [], CCList = [], BCCList = [] } = {}) => ToList.concat(CCList, BCCList);
const noRecipients = (message) => !getRecipients(message).length;

/* @ngInject */
function message(
    $state,
    dispatchers,
    $rootScope,
    mailSettingsModel,
    cache,
    displayContent,
    messageScroll,
    tools,
    unsubscribeModel,
    sendPreferences,
    $exceptionHandler,
    tooltipModel
) {
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
            const { on, dispatcher, unsubscribe } = dispatchers(['messageActions', 'composer.load']);

            const bindClasses = (message) => {
                element[0].classList[noRecipients(message) ? 'add' : 'remove'](CLASSNAME.UNDISCLOSED);
            };

            bindClasses(scope.message);

            const loadMessageBody = () => {
                return cache.getMessage(scope.message.ID).then((message) => _.extend(scope.message, message));
            };

            const reloadEncryptionTooltip = () => {
                const encryptionStatus = element.find('.encryptionStatus');
                tooltipModel.update(encryptionStatus, { title: scope.message.encryptionType() });
            };

            const updateMessage = async (promise) => {
                // must be done when actually loading the message so we don't fetch this info for each message in the conversation
                // (otherwise causes sendPreferences to fetch all keys from the keyapi.
                sendPreferences
                    .get([scope.message.SenderAddress])
                    .then(({ [scope.message.SenderAddress]: { pinned, scheme, isVerified } }) =>
                        scope.$applyAsync(() => {
                            scope.message.isInternal = scheme === SEND_TYPES.SEND_PM;
                            scope.message.promptKeyPinning =
                                !pinned && mailSettingsModel.get('PromptPin') && scheme === SEND_TYPES.SEND_PM;
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

                        const recipients = _.map(scope.message.ToList, 'Address')
                            .concat(_.map(scope.message.CCList, 'Address'))
                            .concat(_.map(scope.message.BCCList, 'Address'));
                        const parsedHeaders = scope.message.ParsedHeaders; // || { };
                        const encryptionList = parseRecipientHeader(
                            parsedHeaders['X-Pm-Recipient-Encryption'] || '',
                            recipients
                        );
                        const authenticationList = parseRecipientHeader(
                            parsedHeaders['X-Pm-Recipient-Authentication'] || '',
                            recipients
                        );

                        const addCryptoInfo = ({ Address, Name }) => ({
                            Address,
                            Name,
                            Authentication: authenticationList[Address],
                            Encryption: encryptionList[Address]
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

            on('message.refresh', async (event, messageIDs) => {
                if (messageIDs.indexOf(scope.message.ID) > -1) {
                    const message = cache.getMessageCached(scope.message.ID);
                    const type = tools.typeView();

                    if (message && canBeOpen(message)) {
                        if (message.IsEncrypted === ENCRYPTED_STATUS.PGP_MIME) {
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
                if (scope.message.Type === 1) {
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
            scope.recipients = () => getRecipients(scope.message);

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
