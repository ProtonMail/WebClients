import _ from 'lodash';

import { DRAFT, MAILBOX_IDENTIFIERS, ROW_MODE } from '../../constants';

/* @ngInject */
function conversation(
    $filter,
    $rootScope,
    $state,
    $stateParams,
    actionConversation,
    conversationListeners,
    messageActions,
    authentication,
    messageScroll,
    cache,
    tools,
    hotkeys,
    labelsModel,
    mailSettingsModel,
    findExpandableMessage,
    dispatchers
) {
    /**
     * Find the position of the scrollable item
     * @return {Function} <index:Integer, max:Integer, type:String>
     */
    const getScrollToPosition = () => {
        const container = document.getElementById('pm_thread');
        const HEIGHT = 42;

        /**
         * Compute the size to remove or add for the scroll
         * @param  {Node} node Element
         * @param  {String} type Type of selection
         * @return {Number}
         */
        const getDelta = (node, type) => {
            if (type === 'UP') {
                // First element
                if (!node.previousElementSibling) {
                    return 0;
                }

                // If it's open add its size + the height of an item
                const isOpen = node.previousElementSibling.classList.contains('open');
                return isOpen ? node.previousElementSibling.offsetHeight + HEIGHT : HEIGHT;
            }

            // For the next one
            const isOpen = node.nextElementSibling && node.nextElementSibling.classList.contains('open');
            return isOpen ? node.nextElementSibling.offsetHeight + HEIGHT : HEIGHT;
        };

        return (index, max, type = 'UP') => {
            const $item = container.querySelector('.message.marked');
            if ($item) {
                const delta = getDelta($item, type);
                if (index === 0) {
                    return (container.scrollTop = 0);
                }

                if (type === 'UP') {
                    container.scrollTop -= delta;
                }

                if (type === 'DOWN') {
                    container.scrollTop = $item.offsetTop + delta - container.offsetHeight / 2;
                }
            }
        };
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {
            conversation: '='
        },
        templateUrl: require('../../../templates/partials/conversation.tpl.html'),
        link(scope) {
            let messagesCached = [];
            const { on, unsubscribe, dispatcher } = dispatchers(['message.open', 'elements', 'composer.load']);

            const scrollToPosition = getScrollToPosition();
            let unsubscribeActions = angular.noop;
            scope.messages = [];
            scope.mailbox = tools.currentMailbox();
            scope.labels = labelsModel.get();
            scope.showTrashed = false;
            scope.showNonTrashed = false;
            $rootScope.numberElementSelected = 1;
            $rootScope.showWelcome = false;
            scope.inTrash = $state.includes('secured.trash.**');
            scope.inSpam = $state.includes('secured.spam.**');
            scope.getElements = () => [scope.conversation];

            const openMarked = (message) => () => {
                const msg = message || scope.markedMessage;

                if (!msg) {
                    return;
                }

                if (msg.Type === DRAFT) {
                    return dispatcher['composer.load']('', msg);
                }

                dispatcher['message.open']('toggle', {
                    action: 'openMarked',
                    message: msg
                });
            };

            on('refreshConversation', (event, conversationIDs) => {
                if (conversationIDs.indexOf(scope.conversation.ID) > -1) {
                    refreshConversation();
                }
            });
            on('message.expiration', () => {
                scope.$applyAsync(() => refreshConversation());
            });

            // We need to allow hotkeys for a message when you open the message
            on('message.open', (event, { type, data }) => {
                if (type === 'toggle') {
                    unsubscribeActions();
                    unsubscribeActions = conversationListeners(data.message);

                    // Allow the user to scroll inside the conversation via the keyboard
                    hotkeys.unbind(['down', 'up']);
                    scope.markedMessage = undefined;
                }

                if (type === 'render') {
                    return messageScroll.to(data);
                }
            });

            on('unmarkMessages', () => {
                scope.markedMessage = undefined;
                unsubscribeActions();
            });

            scope.$on('move', (e, mailbox) => {
                unsubscribeActions();

                const labelID = MAILBOX_IDENTIFIERS[mailbox];

                /**
                 * Move item only when we didn't select anything
                 * -> Prevent x2 move with marked item by elementsCtrl
                 */
                if ($rootScope.numberElementChecked) {
                    return;
                }

                if (scope.markedMessage) {
                    return $rootScope.$emit('messageActions', {
                        type: 'move',
                        data: { ids: [scope.markedMessage.ID], labelID }
                    });
                }
                actionConversation.move([scope.conversation.ID], labelID);
            });

            const onNextPrevElement = (type) => () => {
                const index = _.findIndex(scope.messages, { expand: true });
                const pos = type === 'DOWN' ? index + 1 : index - 1;
                const message = scope.messages[pos];

                // Last item
                if (type === 'DOWN' && pos === scope.messages.length) {
                    return;
                }

                // First item
                if (type === 'UP' && !index) {
                    return;
                }

                scope.$applyAsync(() => {
                    scope.messages[index].expand = false;
                    scrollToPosition(pos, scope.messages.length, type);
                    unsubscribeActions = conversationListeners(message);
                    openMarked(message)();
                });
            };

            scope.$on('newElement', onNextPrevElement('UP'));
            scope.$on('oldElement', onNextPrevElement('DOWN'));

            scope.$on('markPrevious', () => {
                unsubscribeActions();
                if (scope.markedMessage) {
                    const index = scope.messages.indexOf(scope.markedMessage);
                    if (index > 0) {
                        const pos = index - 1;
                        scope.$applyAsync(() => {
                            scope.markedMessage = scope.messages[pos];
                            scrollToPosition(pos, scope.messages.length, 'UP');
                            unsubscribeActions = conversationListeners(scope.markedMessage);
                        });
                    }
                }
            });

            scope.$on('markNext', () => {
                unsubscribeActions();
                if (scope.markedMessage) {
                    const index = scope.messages.indexOf(scope.markedMessage);
                    if (index < scope.messages.length - 1) {
                        const pos = index + 1;
                        scope.$applyAsync(() => {
                            scope.markedMessage = scope.messages[pos];
                            scrollToPosition(pos, scope.messages.length, 'DOWN');
                            unsubscribeActions = conversationListeners(scope.markedMessage);
                        });
                    }
                }
            });

            on('toggleStar', () => {
                const data = {
                    model: scope.conversation,
                    type: 'conversation'
                };

                if (scope.markedMessage) {
                    data.model = scope.markedMessage;
                    data.type = 'message';
                }
                dispatcher.elements('toggleStar', data);
            });

            // We don't need to check these events if we didn't choose to focus onto a specific message
            hotkeys.unbind(['down', 'up']);

            // Restore them to allow custom keyboard navigation
            scope.$on('left', () => hotkeys.bind(['down', 'up']));
            scope.$on('openMarked', openMarked());

            scope.$on('right', () => {
                unsubscribeActions();
                !scope.markedMessage &&
                    scope.$applyAsync(() => {
                        scope.markedMessage = _.last(scope.messages);
                        unsubscribeActions = conversationListeners(scope.markedMessage);
                        messageScroll.toID(scope.markedMessage.ID, scope.messages);

                        hotkeys.bind(['down', 'up']);
                    });
            });

            scope.$on('escape', () => {
                back();
            });

            /**
             * Back to the parent state
             */
            function back() {
                const route = $state.$current.name.replace('.element', '');
                $state.go(route, { id: null });
            }

            /**
             * Set a flag (expand) to the message to be expanded
             * @param {Array} messages
             * @return {Array} messages
             */
            function expandMessage(messages = []) {
                const message = findExpandableMessage.find(messages);
                messages.length && (message.openMe = true);
                return messages;
            }

            /**
             * Method call at the initialization of this directive
             */
            function initialization() {
                messagesCached = cache.queryMessagesCached($stateParams.id);
                scope.trashed = _.some(messagesCached, ({ LabelIDs }) =>
                    _.includes(LabelIDs, MAILBOX_IDENTIFIERS.trash)
                );
                scope.nonTrashed = _.some(
                    messagesCached,
                    ({ LabelIDs }) => !_.includes(LabelIDs, MAILBOX_IDENTIFIERS.trash)
                );

                const messages = $filter('filterMessages')(messagesCached, scope.showTrashed, scope.showNonTrashed);

                if (messages.length > 0) {
                    // Reset status
                    const list = _.map(cache.orderMessage(messages, false), (msg) => {
                        delete msg.expand;
                        delete msg.openMe;
                        return msg;
                    });

                    scope.messages = expandMessage(list);
                    unsubscribeActions = conversationListeners(_.last(scope.messages));

                    if (mailSettingsModel.get('ViewLayout') === ROW_MODE) {
                        scope.markedMessage = $rootScope.expandMessage;
                    }

                    dispatcher.elements('mark', { id: $stateParams.id });
                    dispatcher.elements('opened', { id: $stateParams.id });
                } else {
                    back();
                }
            }

            /**
             * Refresh the current conversation with the latest change reported by the event log manager
             */
            function refreshConversation() {
                const conversation = cache.getConversationCached($stateParams.id);
                const messages = cache.queryMessagesCached($stateParams.id);
                const labelID = tools.currentLocation();

                messagesCached = messages;
                scope.trashed = messagesCached.some(({ LabelIDs = [] }) =>
                    _.includes(LabelIDs, MAILBOX_IDENTIFIERS.trash)
                );
                scope.nonTrashed = messagesCached.some(
                    ({ LabelIDs = [] }) => !_.includes(LabelIDs, MAILBOX_IDENTIFIERS.trash)
                );

                if (!conversation) {
                    return back();
                }

                const label = _.find(conversation.Labels, { ID: labelID });

                if (label || $state.includes('secured.search.**')) {
                    _.extend(scope.conversation, conversation);
                } else {
                    return back();
                }

                if (Array.isArray(messages) && messages.length > 0) {
                    const toAdd = [];
                    const toRemove = [];
                    const list = cache.orderMessage(
                        $filter('filterMessages')(messages, scope.showTrashed, scope.showNonTrashed),
                        false
                    );

                    for (let index = 0; index < list.length; index++) {
                        if (!scope.messages.some(({ ID }) => ID === list[index].ID)) {
                            toAdd.push({ index, message: list[index] });
                        }
                    }

                    for (let index = 0; index < toAdd.length; index++) {
                        const ref = toAdd[index];
                        // Insert new message at a specific index
                        scope.messages.splice(ref.index, 0, ref.message);
                    }

                    for (let index = 0; index < scope.messages.length; index++) {
                        if (!list.some(({ ID }) => ID === scope.messages[index].ID)) {
                            toRemove.push({ index });
                        }
                    }

                    for (let index = toRemove.length - 1; index >= 0; index--) {
                        // Remove message deleted
                        scope.messages.splice(toRemove[index].index, 1);
                    }

                    if (!scope.messages.length) {
                        back();
                    }
                } else {
                    back();
                }
            }

            scope.toggleOption = (option) => {
                scope[option] = !scope[option];
                refreshConversation();
            };

            /**
             * @return {Boolean}
             */
            scope.showNotifier = (folder) => {
                const filtered = _.filter(messagesCached, (message) =>
                    _.includes(message.LabelIDs, MAILBOX_IDENTIFIERS[folder])
                );
                return filtered.length < messagesCached.length && filtered.length > 0;
            };

            /**
             * Return messages data for dropdown labels
             */
            scope.getMessages = () => scope.messages;

            /**
             * Mark current conversation as read
             * @param {Boolean} back
             */
            scope.read = () => actionConversation.read([scope.conversation.ID]);

            /**
             * Mark current conversation as unread
             */
            scope.unread = () => {
                actionConversation.unread([scope.conversation.ID]);
                back();
            };

            /**
             * Delete current conversation
             */
            scope.delete = () => actionConversation.remove([scope.conversation.ID]);

            /**
             * Apply labels for the current conversation
             * @return {Promise}
             */
            scope.saveLabels = (labels, alsoArchive) => {
                actionConversation.label([scope.conversation.ID], labels, alsoArchive);
            };

            initialization();

            scope.$on('$destroy', () => {
                unsubscribe();
                unsubscribeActions();
                // Ensure only one event Listener
                hotkeys.unbind(['down', 'up']);
                hotkeys.bind(['down', 'up']);
                dispatcher.elements('close', { element: scope.conversation });
            });
        }
    };
}
export default conversation;
