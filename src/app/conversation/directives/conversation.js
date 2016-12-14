angular.module('proton.conversation')
.directive('conversation', (
    $filter,
    $rootScope,
    $state,
    $stateParams,
    $timeout,
    actionConversation,
    conversationListeners,
    messageActions,
    authentication,
    messageScroll,
    cache,
    CONSTANTS,
    tools,
    hotkeys
) => {

    /**
     * Find in the message to scroll and expand
     * @param  {Array}  list List of message
     * @return {Object}
     */
    function findExpendableMessage(messages = []) {
        let thisOne;

        const filter = (cb) => _.chain(messages).filter(cb).last().value();

        switch (true) {
            // If we open a conversation in the sent folder
            case tools.typeView() === 'message':
                thisOne = _.last(messages);
                break;

            case !!$stateParams.messageID:
                thisOne = _.findWhere(messages, { ID: $stateParams.messageID });
                break;

            case $state.includes('secured.starred.**'):
                // Select the last message starred
                thisOne = filter(({ LabelIDs }) => LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1);
                break;

            case $state.includes('secured.label.**'):
                // Select the last message with this label
                thisOne = filter(({ LabelIDs }) => LabelIDs.indexOf($stateParams.label) !== -1);
                break;

            case $state.includes('secured.drafts.**'):
                thisOne = filter(({ Type }) => Type === CONSTANTS.DRAFT);
                break;

            default: {
                const latest = filter(({ Type }) => Type !== CONSTANTS.DRAFT);

                if (latest && latest.IsRead === 1) {
                    thisOne = latest;
                    break;
                }

                /**
                 * Filter the list of message to find the first readable message
                 * - iterate backwards
                 * - check if the previous item is read
                 * - if the previous isRead === 1, break the iteration
                 * @return {Ressoure}
                 */
                const getMessage = () => {
                    const withoutDraft = messages.filter(({ Type }) => Type !== CONSTANTS.DRAFT);

                    // Else we open the first message unread beginning to the end list
                    let index = withoutDraft.length;
                    let contains = false;

                    while (--index > 0) {
                        if (withoutDraft[index - 1].IsRead === 1) { // Is read
                            contains = true;
                            break;
                        }
                    }

                    const position = contains ? index : 0;
                    // A conversation can contains only one draft
                    return withoutDraft.length ? withoutDraft[position] : messages[0];
                };

                thisOne = getMessage();
                break;
            }
        }

        return thisOne;
    }

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
        scope: {
            conversation: '='
        },
        templateUrl: 'templates/partials/conversation.tpl.html',
        link(scope) {
            let messagesCached = [];
            const unsubscribe = [];

            const scrollToPosition = getScrollToPosition();
            let unsubscribeActions = angular.noop;

            scope.mailbox = tools.currentMailbox();
            scope.labels = authentication.user.Labels;
            scope.currentState = $state.$current.name;
            scope.scrolled = false;
            scope.showTrashed = false;
            scope.showNonTrashed = false;
            $rootScope.numberElementSelected = 1;
            $rootScope.showWelcome = false;
            scope.inTrash = $state.includes('secured.trash.**');
            scope.inSpam = $state.includes('secured.spam.**');

            // Listeners
            unsubscribe.push($rootScope.$on('refreshConversation', (event, conversationIDs) => {
                if (conversationIDs.indexOf(scope.conversation.ID) > -1) {
                    refreshConversation();
                }
            }));
            unsubscribe.push($rootScope.$on('message.expiration', () => {
                scope.$applyAsync(() => refreshConversation());
            }));

            // We need to allow hotkeys for a message when you open the message
            unsubscribe.push($rootScope.$on('message.open', (event, { type, data }) => {
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
            }));

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
                unsubscribeActions();
                // Ensure only one event Listener
                hotkeys.unbind(['down', 'up']);
                hotkeys.bind(['down', 'up']);
                $rootScope.$emit('conversation.close', scope.conversation);
            });

            scope.$on('unmarkMessages', () => {
                scope.markedMessage = undefined;
                unsubscribeActions();
            });


            scope.$on('markPrevious', () => {
                unsubscribeActions();
                if (scope.markedMessage) {
                    const index = scope.messages.indexOf(scope.markedMessage);
                    if (index > 0) {
                        const pos = index - 1;
                        scope
                            .$applyAsync(() => {
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
                    if (index < (scope.messages.length - 1)) {
                        const pos = index + 1;
                        scope
                            .$applyAsync(() => {
                                scope.markedMessage = scope.messages[pos];
                                scrollToPosition(pos, scope.messages.length, 'DOWN');
                                unsubscribeActions = conversationListeners(scope.markedMessage);
                            });


                    }
                }
            });

            scope.$on('toggleStar', () => {
                scope.toggleStar();
            });

            // We don't need to check these events if we didn't choose to focus onto a specific message
            hotkeys.unbind(['down', 'up']);

            // Restore them to allow custom keyboard navigation
            scope.$on('left', () => hotkeys.bind(['down', 'up']));
            scope.$on('openMarked', () => {
                if (scope.markedMessage) {
                    if (scope.markedMessage.Type === CONSTANTS.DRAFT) {
                        return $rootScope.$emit('composer.load', scope.markedMessage);
                    }
                    $rootScope.$emit('message.open', {
                        type: 'toggle',
                        data: {
                            action: 'openMarked',
                            message: scope.markedMessage
                        }
                    });
                }

            });

            scope.$on('move', (event, mailbox) => {
                const ids = scope.markedMessage ? [scope.markedMessage.ID] : scope.messages.map(({ ID }) => ID);
                $rootScope.$emit('messageActions', { action: 'move', data: { ids, mailbox } });
            });

            scope.$on('right', () => {
                unsubscribeActions();
                !scope.markedMessage && scope
                    .$applyAsync(() => {
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
                const name = $state.$current.name;
                const route = name.replace('.element', '');

                $state.go(route, { id: '' }, { reload: true });
            }

            /**
             * Set a flag (expand) to the message to be expanded
             * @param {Array} messages
             * @return {Array} messages
             */
            function expandMessage(messages = []) {

                const message = findExpendableMessage(messages);
                messages.length && (message.openMe = true);
                return messages;
            }

            /**
             * Method call at the initialization of this directive
             */
            function initialization() {
                let messages = [];
                messagesCached = cache.queryMessagesCached($stateParams.id);
                scope.trashed = _.some(messagesCached, ({ LabelIDs }) => _.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));
                scope.nonTrashed = _.some(messagesCached, ({ LabelIDs }) => !_.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));

                messages = $filter('filterMessages')(messagesCached, scope.showTrashed, scope.showNonTrashed);

                if (messages.length > 0) {

                    // Reset status
                    const list = _.map(cache.orderMessage(messages, false), (msg) => {
                        delete msg.expand;
                        delete msg.openMe;
                        return msg;
                    });

                    scope.messages = expandMessage(list);
                    unsubscribeActions = conversationListeners(_.last(scope.messages));

                    if (authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
                        scope.markedMessage = $rootScope.expandMessage;
                    }
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
                const loc = tools.currentLocation();

                messagesCached = messages;
                scope.trashed = messagesCached.some(({ LabelIDs = [] }) => _.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));
                scope.nonTrashed = messagesCached.some(({ LabelIDs = [] }) => !_.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));

                if (!conversation) {
                    return back();
                }

                if (conversation.LabelIDs.indexOf(loc) !== -1 || $state.includes('secured.search.**')) {
                    _.extend(scope.conversation, conversation);
                } else {
                    return back();
                }

                if (Array.isArray(messages) && messages.length > 0) {
                    const toAdd = [];
                    const toRemove = [];
                    const list = cache
                        .orderMessage($filter('filterMessages')(messages, scope.showTrashed, scope.showNonTrashed), false);

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
                } else {
                    back();
                }
            }

            scope.toggleOption = function (option) {
                scope[option] = !scope[option];
                refreshConversation();
            };

            /**
             * @return {Boolean}
             */
            scope.showNotifier = function (folder) {
                const filtered = _.filter(messagesCached, (message) => _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS[folder]));
                return filtered.length < messagesCached.length && filtered.length > 0;
            };

            /**
             * Return messages data for dropdown labels
             */
            scope.getMessages = function () {
                return scope.messages;
            };

            /**
             * Mark current conversation as read
             * @param {Boolean} back
             */
            scope.read = function () {
                const ids = [scope.conversation.ID];

                actionConversation.read(ids);
            };

            /**
             * Mark current conversation as unread
             */
            scope.unread = function () {
                actionConversation.unread([scope.conversation.ID]);
                back();
            };

            /**
             * Delete current conversation
             */
            scope.delete = function () {
                actionConversation.remove([scope.conversation.ID]);
            };

            /**
             * Move current conversation to a specific location
             */
            scope.move = function (mailbox) {
                actionConversation.move([scope.conversation.ID], mailbox);
            };

            /**
             * Apply labels for the current conversation
             * @return {Promise}
             */
            scope.saveLabels = function (labels, alsoArchive) {
                actionConversation.label([scope.conversation.ID], labels, alsoArchive);
            };

            /**
             * Toggle star status for current conversation
             */
            scope.toggleStar = function () {
                if (scope.starred() === true) {
                    scope.unstar();
                } else {
                    scope.star();
                }
            };

            /**
             * Star the current conversation
             */
            scope.star = function () {
                actionConversation.star(scope.conversation.ID);
            };

            /**
             * Unstar the current conversation
             */
            scope.unstar = function () {
                actionConversation.unstar(scope.conversation.ID);
            };

            /**
             * Return status of the star conversation
             * @return {Boolean}
             */
            scope.starred = function () {
                return scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
            };

            // Call initialization
            initialization();
        }
    };
});
