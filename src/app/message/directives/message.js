angular.module('proton.message')
.directive('message', (
    $stateParams,
    $state,
    $q,
    $rootScope,
    $window,
    authentication,
    cache,
    networkActivityTracker,
    displayContent,
    displayImages,
    displayEmbedded,
    messageScroll,
    Message,
    tools
) => {

    function getRecipients({ ToList = [], CCList = [], BCCList = [] } = {}) {
        return [].concat(ToList, CCList, BCCList);
    }

    /**
     * Back to element list
     */
    function back() {
        const name = $state.$current.name;
        const route = name.replace('.element', '');

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
        templateUrl: 'templates/message/message.tpl.html',
        scope: {
            message: '=model',
            marked: '=',
            last: '=',
            index: '='
        },
        link(scope, element) {
            const unsubscribe = [];
            initMessage();

            unsubscribe.push($rootScope.$on('message.open', (e, { type, data }) => {

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
                            scope.$applyAsync(() => scope.body = data.body);
                        }
                        break;

                    case 'save.success':
                        if ($state.includes('secured.drafts.**')) {
                            return $state.go('secured.drafts');
                        }

                        openMessage();
                        break;
                }
            }));

            unsubscribe.push($rootScope.$on('message.refresh', (event, messageIDs) => {
                if (messageIDs.indexOf(scope.message.ID) > -1) {
                    const message = cache.getMessageCached(scope.message.ID);
                    const type = tools.typeView();

                    if (message && canBeOpen(message)) {
                        scope.message = _.extend(scope.message, message);
                    } else if (type === 'message') {
                        back();
                    }
                }
            }));

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });

            function openMessage({ expand } = {}) {
                if (scope.message.Type === 1) {
                    if ($state.includes('secured.drafts.**')) {
                        $rootScope.$emit('composer.load', scope.message);
                    }
                    return;
                }

                // Default there is no expand, this key is coming from toggleMessage
                if (expand === false) {
                    return;
                }

                const promise = (typeof scope.message.Body === 'undefined') ? loadMessageBody() : Promise.resolve();

                promise
                .then(() => loadContent())
                .then(() => {
                    // Auto focus message list when we load the message, to allow keyboard srolling
                    scope.$applyAsync(() => {
                        // If you switch to another conversation the container might not exist
                        $(document.getElementById('pm_thread')).focus();
                    });
                });
            }

            /**
             * Initialize the message
             */
            function initMessage() {
                if (scope.message.openMe || scope.message.expand) {
                    openMessage();
                }
            }

            function loadMessageBody() {
                return cache.getMessage(scope.message.ID).then((message) => _.extend(scope.message, message));
            }

            function updateMessage(promise) {
                promise.then(({ type, body }) => {
                    scope.message.expand = true;
                    scope.message.isPlain = (type === 'plain');
                    if (type && body) {
                        scope.message.viewMode = 'html';
                        scope.body = body;
                    }
                })
                .catch(() => {
                    scope.message.expand = true;
                    scope.message.viewMode = 'plain';
                });
            }

            function loadContent() {
                return updateMessage(displayContent(scope.message, scope.body, scope.index));
            }

            scope.body = ''; // Here we put the content displayed inside the message content

            /**
             * Get all recipients
             * @return {Array} recipients
             */
            scope.recipients = () => {
                return getRecipients(scope.message);
            };

            /**
             * Check if the sender is the current user
             * @return {Boolean}
             */
            scope.senderIsMe = () => {
                return _.findIndex(authentication.user.Addresses, { Email: scope.message.Sender.Address }) !== -1;
            };

            /**
             * Display PGP
             */
            scope.viewPgp = () => {
                const content = scope.message.Header + '\n\r' + scope.message.Body;
                const tab = $state.href('pgp', {}, { absolute: true });
                const url = window.location.href;
                const arr = url.split('/');
                const targetOrigin = arr[0] + '//' + arr[2];
                function sendPgp(event) {
                    if (event.data === 'sendPgp') {
                        event.source.postMessage(content, targetOrigin);
                        window.removeEventListener('message', sendPgp, false);
                    }
                }
                window.addEventListener('message', sendPgp, false);
                window.open(tab, '_blank');
            };

            /**
             * Print current message
             */
            scope.print = () => {
                const tab = $state.href('printer', { messageID: scope.message.ID }, { absolute: true });
                const url = window.location.href;
                const arr = url.split('/');
                const targetOrigin = arr[0] + '//' + arr[2];
                const sendMessage = (event) => {
                    if (event.data === scope.message.ID) {
                        const message = scope.message;
                        const bodyDecrypted = element[0].querySelector('.bodyDecrypted');

                        message.content = bodyDecrypted.innerHTML;
                        event.source.postMessage(JSON.stringify(scope.message), targetOrigin);
                        window.removeEventListener('message', sendMessage, false);
                    }
                };
                window.addEventListener('message', sendMessage, false);
                window.open(tab, '_blank');
            };

            // TODO need review with label dropdown
            scope.getMessage = () => {
                return [scope.message];
            };

            /**
             * Method call when the user submit some labels to apply to this message
             * @param {Array} labels
             * @param {Boolean} alsoArchive
             */
            scope.saveLabels = (labels, alsoArchive) => {
                const messages = [scope.message];

                $rootScope.$emit('messageActions', { action: 'label', data: { messages, labels, alsoArchive } });
            };

            /**
             * Go to label folder + reset parameters
             * @param {String} labelID
             */
            scope.goToLabel = (labelID = '') => {
                const params = { page: undefined, filter: undefined, sort: undefined, label: labelID };

                $state.go('secured.label', params);
            };

            /**
             * Move current message
             * @param {String} mailbox
             */
            scope.move = (mailbox) => {
                const ids = [scope.message.ID];

                $rootScope.$emit('messageActions', { action: 'move', data: { ids, mailbox } });
            };

            /**
             * Mark current message as read
             */
            scope.read = () => {
                const ids = [scope.message.ID];

                scope.message.expand = true;
                $rootScope.$emit('messageActions', { action: 'read', data: { ids } });
            };

            /**
             * Mark current message as unread
             */
            scope.unread = () => {
                const ids = [scope.message.ID];

                scope.message.expand = false;
                $rootScope.$emit('messageActions', { action: 'unread', data: { ids } });
            };

            /**
             * Delete current message
             */
            scope.delete = () => {
                const ids = [scope.message.ID];

                $rootScope.$emit('messageActions', { action: 'delete', data: { ids } });
            };

            /**
             * Allow the user to switch the message content between plain and html
             */
            scope.togglePlainHtml = () => {
                scope.message.viewMode = (scope.message.viewMode === 'plain') ? 'html' : 'plain';
            };

        }
    };
});
