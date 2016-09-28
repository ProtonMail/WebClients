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
    Message,
    tools,
    CONSTANTS
) => {

    /**
     * Scroll to this content message
     */
    function scroll(node, index) {
        const $header = document.getElementById('conversationHeader');
        const $thread = document.getElementById('pm_thread');
        const headerOffset = $header ? ($header.getBoundingClientRect().top + $header.offsetHeight) : 0;
        const amountScrolled = $thread ? $thread.scrollTop : 0;
        const paddingTop = ~~$thread.style.paddingTop.replace('px', '');

        let scrollTop = node ? (node.getBoundingClientRect().top + amountScrolled - headerOffset - paddingTop) : 0;

        if (index === 0) {
            // Do nothing
        } else if (index === 1) {
            scrollTop -= 15;
        } else if (index > 1) {
            scrollTop -= 68;
        }

        $($thread).animate({ scrollTop }, 200);
    }

    function checkLabel({LabelIDs = []}, mailbox = '') {
        const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];

        return LabelIDs.indexOf(labelID) !== -1;
    }

    function getRecipients({ToList = [], CCList = [], BCCList = []} = {}) {
        return [].concat(ToList).concat(CCList).concat(BCCList);
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
    function canBeOpen({LabelIDs = []}) {
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
            last: '=',
            index: '='
        },
        link(scope, element) {
            const unsubscribe = [];
            const postMessageSupport = $.browser.msie !== true || $.browser.edge === true; // NOTE postMessage still broken on IE11

            initMessage();

            unsubscribe.push($rootScope.$on('message.embedded.injected', (event, message, body) => {
                if (scope.message.ID === message.ID) {
                    scope.$applyAsync(() => {
                        scope.body = body;
                    });
                }
            }));

            unsubscribe.push($rootScope.$on('message.open', (e, { type, data }) => {
                if (data.message.ID !== scope.message.ID) {
                    return;
                }

                switch (type) {
                    case 'toggle':
                        openMessage();
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

            scope.$on('$destroy', function(event) {
                unsubscribe.forEach(cb => cb());
                unsubscribe.length = 0;
            });

            function openMessage() {
                if (scope.message.Type === 1) {
                    if ($state.includes('secured.drafts.**')) {
                        $rootScope.$emit('composer.load', scope.message);
                    }
                } else {
                    const promise = (typeof scope.message.Body === 'undefined') ? loadMessageBody() : Promise.resolve();

                    promise
                    .then(() => loadContent());
                }
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

                    if (type && body) {
                        scope.message.viewMode = type;
                        scope.body = body;
                    }

                    scroll(element[0], scope.index);
                })
                .then(null, () => {
                    scope.message.viewMode = 'plain';
                });
            }

            function loadContent() {
                return updateMessage(displayContent(scope.message, scope.body, scope.index));
            }

            scope.body = ''; // Here we put the content displayed inside the message content

            /**
             * Check if the current message is a sent
             * @return {Boolean}
             */
            scope.isSent = () => {
                return scope.message.Type === 2 || scope.message.Type === 3;
            };

            /**
             * Check if the current message is archived
             * @return {Boolean}
             */
            scope.isArchive = () => {
                return checkLabel(scope.message, 'archive');
            };

            /**
             * Check if the current message is a draft
             * @return {Boolean}
             */
            scope.isDraft = () => {
                return scope.message.Type === 1;
            };

            /**
             * Check if the current message is in trash
             * @return {Boolean}
             */
            scope.isTrash = () => {
                return checkLabel(scope.message, 'trash');
            };

            /**
             * Check if the current message is in spam
             * @return {Boolean}
             */
            scope.isSpam = () => {
                return checkLabel(scope.message, 'spam');
            };

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
                return _.findIndex(authentication.user.Addresses, {Email: scope.message.Sender.Address}) !== -1;
            };

            /**
             * Display PGP
             */
            scope.viewPgp = function() {
                let content = scope.message.Header + '\n\r' + scope.message.Body;
                const filename = 'pgp.txt';

                if (navigator.msSaveBlob) { // IE 10+
                    content = content.replace(/\n/g, '\r\n');
                    const blob = new Blob([content], { type: 'data:text/plain;base64;' });
                    navigator.msSaveBlob(blob, filename);
                } else {
                    window.open('data:text/plain;base64,' + btoa(content), '_blank');
                }
            };

            /**
             * Print current message
             */
            scope.print = () => {
                if (postMessageSupport) {
                    const tab = $state.href('printer', {messageID: scope.message.ID}, {absolute: true});
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
                } else {
                    window.print();
                }
            };

            /**
             * Get the decrypted content and fix images inside
             */
            scope.displayImages = () => {
                scope.body = displayImages(scope.message, scope.body);
            };

            /**
             * Load embedded content from attachments
             */
            scope.displayEmbedded = () => {
                scope.body = displayEmbedded(scope.message, scope.body);
            };

            /**
             * Open a new composer and pre-fill the to field
             * @param  {Object} email - {Address, }
             */
            scope.sendMessageTo = (email = {}) => {
                const message = new Message();

                message.ToList = [email];
                $rootScope.$emit('composer.new', {message, type: 'new'});
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

                $rootScope.$emit('messageActions', {action: 'label', data: {messages, labels, alsoArchive}});
            };

            /**
             * Detach label to the current message
             * @param {Object} label
             */
            scope.detachLabel = (label) => {
                $rootScope.$emit('messageActions', {action: 'unlabel', data: {
                    messageID: scope.message.ID,
                    conversationID: scope.message.ConversationID,
                    labelID: label.ID
                }});
            };

            /**
             * Go to label folder + reset parameters
             * @param {String} labelID
             */
            scope.goToLabel = (labelID = '') => {
                const params = {page: undefined, filter: undefined, sort: undefined, label: labelID};

                $state.go('secured.label', params);
            };

            /**
             * Move current message
             * @param {String} mailbox
             */
            scope.move = (mailbox) => {
                const ids = [scope.message.ID];

                $rootScope.$emit('messageActions', {action: 'move', data: {ids, mailbox}});
            };

            /**
             * Mark current message as read
             */
            scope.read = () => {
                const ids = [scope.message.ID];

                scope.message.expand = true;
                $rootScope.$emit('messageActions', {action: 'read', data: {ids}});
            };

            /**
             * Mark current message as unread
             */
            scope.unread = () => {
                const ids = [scope.message.ID];

                scope.message.expand = false;
                $rootScope.$emit('messageActions', {action: 'unread', data: {ids}});
            };

            /**
             * Delete current message
             */
            scope.delete = () => {
                const ids = [scope.message.ID];

                $rootScope.$emit('messageActions', {action: 'delete', data: {ids}});
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
