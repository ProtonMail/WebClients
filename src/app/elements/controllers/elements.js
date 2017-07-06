angular.module('proton.elements')
.controller('ElementsController', (
    $filter,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $window,
    actionConversation,
    AttachmentLoader,
    authentication,
    labelsModel,
    limitElementsModel,
    cache,
    cacheCounters,
    confirmModal,
    CONSTANTS,
    embedded,
    eventManager,
    firstLoad,
    gettextCatalog,
    Label,
    networkActivityTracker,
    notify,
    paginationModel,
    settingsApi,
    AppModel,
    markedScroll,
    tools
) => {
    const unsubscribes = [];
    let unbindWatcherElements;
    const MINUTE = 60 * 1000;

    const id = setInterval(() => {
        $rootScope.$emit('elements', { type: 'refresh.time' });
    }, MINUTE);

    $scope.elementsLoaded = false;
    $scope.limitReached = false;
    $scope.conversations = [];
    /**
     * Method called at the initialization of this controller
     */
    function initialization() {

        // Variables
        $scope.markedElement = undefined;
        $scope.mailbox = tools.currentMailbox();
        $scope.conversationsPerPage = authentication.user.NumMessagePerPage;
        $scope.labels = labelsModel.get();
        $scope.messageButtons = authentication.user.MessageButtons;
        $scope.selectedFilter = $stateParams.filter;
        $scope.selectedOrder = $stateParams.sort || '-date';
        $scope.page = ~~$stateParams.page || 1;
        $scope.startWatchingEvent();
        $scope.refreshElements()
            .then(() => {
                $scope.$applyAsync(() => {
                    $scope.selectElements('all', false);
                }); // If we don't use the timeout, messages seems not available (to unselect for example)
                // I consider this trick like a bug in the angular application
            }, $log.error);
    }

    $scope.$on('$stateChangeSuccess', () => {
        $scope.elementsLoaded = false;
        $scope.limitReached = false;
    });

    function watchElements() {
        if (angular.isDefined(unbindWatcherElements)) {
            unbindWatcherElements();
        }

        unbindWatcherElements = $scope.$watch('conversations', () => {
            $rootScope.numberElementSelected = getElementsSelected().length;
            $rootScope.numberElementUnread = cacheCounters.unreadConversation(tools.currentLocation());
        }, true);
    }

    $scope.senders = (element) => {
        if (angular.isDefined(element.Senders)) {
            return element.Senders;
        }

        return [element.Sender];
    };

    $scope.recipients = (element) => {
        if (angular.isDefined(element.Recipients)) {
            return element.Recipients;
        }
        let recipients = [];

        if (element.ToList) {
            recipients = recipients.concat(element.ToList);
        }

        if (element.CCList) {
            recipients = recipients.concat(element.CCList);
        }

        if (element.BCCList) {
            recipients = recipients.concat(element.BCCList);
        }

        return recipients;
    };

    /**
     * Check if we should display the component
     * @param  {String} type
     * @return {Boolean}
     */
    const displayType = (type) => {

        let test = false;
        const isColumnsMode = authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE;
        const isRowsMode = authentication.user.ViewLayout === CONSTANTS.ROW_MODE;

        switch (type) {
            case 'rows': {
                test = !AppModel.is('mobile') && isRowsMode && !$scope.idDefined();
                break;
            }

            case 'columns': {
                test = isColumnsMode && !AppModel.is('mobile');
                break;
            }

            case 'placeholder': {
                const idDefined = $scope.idDefined();
                const shouldDisplay = isColumnsMode && (!idDefined || (idDefined && $rootScope.numberElementChecked > 0));
                test = shouldDisplay && !AppModel.is('mobile');
                break;
            }

            case 'mobile': {
                test = !$scope.idDefined() && AppModel.is('mobile');
                break;
            }
        }

        return test;
    };

    $scope.displayType = displayType;

    $scope.startWatchingEvent = () => {

        let isOpened = false;

        /**
         * Auto detect if there is already a conversation:open, then do nothing
         * We need to give the focus to a conversation, not every conversations
         * @param  {Function} cb
         * @param  {Boolean} value  Default value to set
         * @return {Function}       EventListener
         */
        const onElement = (cb, value = true) => (...arg) => {
            if (!isOpened) {
                cb(...arg);

                if (tools.typeView() === 'conversation') {
                    isOpened = value;
                }
            }
        };

        unsubscribes.push($rootScope.$on('elements', (e, { type, data = {} }) => {
            switch (type) {
                case 'mark': {
                    const thisElement = _.findWhere($scope.conversations, { ID: data.id });

                    if (thisElement && $scope.markedElement !== thisElement) {
                        $scope.$applyAsync(() => {
                            $scope.markedElement = thisElement;
                        });
                    }
                    break;
                }
                case 'open':
                    $scope.$applyAsync(() => openElement(data.element));
                    break;
                case 'close':
                    isOpened = false;
                    break;
                case 'refresh':
                    $scope.refreshElements();
                    break;
                case 'switchTo.next':
                    nextElement(data.conversation);
                    break;
                case 'switchTo.previous':
                    previousElement(data.conversation);
                    break;
            }
        }));

        $scope.$on('openMarked', onElement(() => {
            openElement($scope.markedElement);
        }));

        $scope.$on('left', () => {
            redirectUser();
            isOpened = false;
        });

        $scope.$on('right', onElement(() => {
            openElement($scope.markedElement);
        }));

        $scope.$on('selectMark', () => {
            // Can be undefined when we switch to another state
            $scope.markedElement && $scope.$applyAsync(() => {
                $scope.markedElement.Selected = !$scope.markedElement.Selected;
                $rootScope.numberElementChecked = _.where($scope.conversations, { Selected: true }).length;
            });
        });

        unsubscribes.push($rootScope.$on('selectElements', (event, { value, isChecked }) => {
            $scope.$applyAsync(() => {
                $scope.selectElements(value, isChecked);
            });
        }));

        $scope.$on('applyLabels', (event, LabelID) => {
            $scope.applyLabels(LabelID);
        });

        $scope.$on('move', (event, mailbox) => {
            !isOpened && $scope.move(mailbox);
        });

        $scope.$on('read', () => {
            $scope.read();
        });

        $scope.$on('unread', () => {
            $scope.unread();
        });

        unsubscribes.push($rootScope.$on('toggleStar', () => {
            !isOpened && toggleStar();
        }));

        function toggleStar() {
            const type = getTypeSelected();
            getElementsSelected().forEach((model) => {
                $rootScope.$emit('elements', {
                    type: 'toggleStar',
                    data: { type, model }
                });
            });
        }

        $scope.$on('markPrevious', onElement(() => {
            if ($scope.conversations) {
                const index = $scope.conversations.indexOf($scope.markedElement);

                if (index > 0) {
                    $scope.$applyAsync(() => {
                        $scope.markedElement = $scope.conversations[index - 1];
                    });
                    return markedScroll.follow(true);
                }

                goToPage('previous');
            }
        }, false));

        $scope.$on('markNext', onElement(() => {
            if ($scope.conversations) {
                const index = $scope.conversations.indexOf($scope.markedElement);

                if (index < ($scope.conversations.length - 1)) {
                    $scope.$applyAsync(() => {
                        $scope.markedElement = $scope.conversations[index + 1];
                    });
                    return markedScroll.follow();
                }

                goToPage('next');
            }
        }, false));

        $scope.$on('nextElement', () => {
            nextElement();
        });

        $scope.$on('previousElement', () => {
            previousElement();
        });

        $scope.$on('$destroy', () => {
            unsubscribes.forEach((callback) => callback());
            unsubscribes.length = 0;
            clearInterval(id);
            markedScroll.clear();
        });
    };

    function getWildCard() {
        if (angular.isDefined($stateParams.wildcard)) {
            return $stateParams.wildcard;
        }

        return authentication.user.AutoWildcardSearch;
    }

    function forgeRequestParameters(mailbox) {
        const params = {
            Page: (~~$stateParams.page || 1) - 1
        };

        if (angular.isDefined($stateParams.filter)) {
            params.Unread = +($stateParams.filter === 'unread'); // Convert Boolean to Integer
        }

        if (angular.isDefined($stateParams.sort)) {
            let sort = $stateParams.sort;
            const desc = sort.charAt(0) === '-';

            if (desc === true) {
                sort = sort.slice(1);
            }

            params.Sort = $filter('capitalize')(sort);
            params.Desc = +desc;
        }

        if (mailbox === 'search') {
            params.Address = $stateParams.address;
            params.Label = $stateParams.label;
            params.Keyword = $stateParams.keyword;
            params.To = $stateParams.to;
            params.From = $stateParams.from;
            params.Subject = $stateParams.subject;
            params.Begin = $stateParams.begin;
            params.End = $stateParams.end;
            params.Attachments = $stateParams.attachments;
            params.AutoWildcard = getWildCard();
        } else if (mailbox === 'label') {
            params.Label = $stateParams.label;
        } else {
            params.Label = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        }

        return params;
    }

    $scope.refreshElements = () => {
        const request = forgeRequestParameters($scope.mailbox);
        const type = tools.getTypeList();
        const promise = (type === 'message') ? cache.queryMessages(request) : cache.queryConversations(request);

        return promise.then((elements) => {
            firstLoad.set(false);
            const page = ~~$stateParams.page || 0;
            const selectedMap = $scope.conversations.reduce((map, element) => {
                if (element.Selected) {
                    map[element.ID] = element;
                }
                return map;
            }, {});

            $scope.$applyAsync(() => {
                const previousConversations = angular.copy($scope.conversations);

                $scope.elementsLoaded = true;
                $scope.conversations = elements.map((element) => {
                    element.Selected = typeof selectedMap[element.ID] !== 'undefined';
                    return element;
                });

                watchElements();
                $scope.limitReached = limitElementsModel.isReached() && paginationModel.isMax();

                /**
                 * Redirect the user if there are no elements to display for the current state
                 */
                if ($scope.conversations.length === 0 && page > 0) {
                    return $scope.back();
                }

                if ($scope.conversations.length > 0) {
                    let element;

                    if (!$scope.markedElement) {
                        if ($state.params.id) {
                            element = _.find($scope.conversations, ({ ID, ConversationID }) => $state.params.id === ConversationID || $state.params.id === ID);
                        } else {
                            element = _.first($scope.conversations);
                        }
                    } else {
                        const found = _.findWhere($scope.conversations, { ID: $scope.markedElement.ID });

                        if (found) {
                            element = found;
                        } else {
                            const previousIndexMarked = _.findIndex(previousConversations, { ID: $scope.markedElement.ID }) || 0;
                            element = $scope.conversations[previousIndexMarked] || _.first($scope.conversations);
                        }
                    }

                    $scope.markedElement = element;
                }
            });

            return elements;
        }, () => {
            // If the request failed
            $scope.elementsLoaded = true;
            $scope.conversations = [];
        });
    };

    /**
     * Return if the current element is active
     * @param {Object} element
     * @return {Boolean}
     */
    $scope.active = (element) => {
        if ($rootScope.numberElementChecked === 0 && angular.isDefined($state.params.id)) {
            return $state.params.id === element.ConversationID || $state.params.id === element.ID;
        }

        return false;
    };

    $scope.hasLabels = ({ LabelIDs = [], Labels = [] }) => LabelIDs.length || Labels.length;

    $scope.hasAttachments = (element) => {
        if (element.ConversationID) { // is a message
            return element.NumAttachments > 0;
        }
        // is a conversation
        return element.ContextNumAttachments > 0;
    };

    $scope.isRead = (element) => {
        if (element.ConversationID) { // is a message
            return element.IsRead === 1;
        }
        // is a conversation
        return element.ContextNumUnread === 0;
    };

    $scope.size = (element) => {
        if (element.ConversationID) { // is a message
            return element.Size;
        }
        // is a conversation
        return element.ContextSize;
    };

    $scope.isDisabled = () => {

        if ($scope.markedElement) {
            return false;
        }

        return !$rootScope.numberElementChecked && !angular.isDefined($state.params.id);
    };

    $scope.isCacheContext = () => tools.cacheContext();

    /**
     * Select elements
     * @param {String} value - filter value
     * @param {Boolean} isChecked
     */
    $scope.selectElements = (value, isChecked) => {
        const actions = {
            all(element) {
                element.Selected = isChecked;
            },
            read(element) {
                element.Selected = (element.ContextNumUnread === 0 || element.IsRead === 1) && isChecked;
            },
            unread(element) {
                element.Selected = (element.ContextNumUnread > 0 || element.IsRead === 0) && isChecked;
            },
            starred(element) {
                element.Selected = isStarred(element) && isChecked;
            },
            unstarred(element) {
                element.Selected = !isStarred(element) && isChecked;
            }
        };

        _.each($scope.conversations, (element) => actions[value](element));

        $rootScope.numberElementChecked = _.where($scope.conversations, { Selected: true }).length;
    };

    function isStarred({ LabelIDs = [], Labels = [] }) {
        if (Labels.length) {
            return _.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.starred);
        }
        return !!_.findWhere(Labels, { ID: CONSTANTS.MAILBOX_IDENTIFIERS.starred });
    }

    /**
     * Return [Element] selected
     * @param {Boolean} includeMarked
     * @return {Array} elements
     */
    function getElementsSelected(includeMarked = true) {
        const { conversations = [] } = $scope; // conversations can contains message list or conversation list
        const elements = _.where(conversations, { Selected: true });

        if ($state.params.id && authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
            return _.filter(conversations, ({ ID, ConversationID }) => ID === $state.params.id || ConversationID === $state.params.id);
        }

        if (!elements.length && $scope.markedElement && includeMarked) {
            return _.filter(conversations, ({ ID, ConversationID }) => ID === $scope.markedElement.ID || ConversationID === $scope.markedElement.ID);
        }

        return elements;
    }

    /**
     * Return [IDs]
     * @return {Array}
     */
    function idsSelected() {
        return _.pluck(getElementsSelected(), 'ID');
    }

    /**
     * Get type of the elements selected
     * @return {String}
     */
    function getTypeSelected() {
        const elementsSelected = getElementsSelected();

        if (elementsSelected.length) {
            return elementsSelected[0].ConversationID ? 'message' : 'conversation';
        }

        return '';
    }

    /**
     * Go to the next conversation
     */
    function nextElement() {
        const current = $state.$current.name;
        const elementID = $state.params.id;
        const elementTime = $scope.markedElement.Time;
        const conversationMode = authentication.user.ViewMode === CONSTANTS.CONVERSATION_VIEW_MODE;

        cache.more(elementID, elementTime, 'next')
            .then((element) => {
                const id = (conversationMode) ? (element.ConversationID || element.ID) : element.ID;
                $state.go(current, { id });
                $scope.markedElement = element;
                $rootScope.$emit('elements', { type: 'switchTo.next.success', data: element });
            })
            .catch((data) => {
                $rootScope.$emit('elements', { type: 'switchTo.next.error', data });
            });
    }

    /**
     * Go to the previous conversation
     */
    function previousElement() {
        const current = $state.$current.name;
        const elementID = $state.params.id;
        const elementTime = $scope.markedElement.Time;
        const conversationMode = authentication.user.ViewMode === CONSTANTS.CONVERSATION_VIEW_MODE;

        cache.more(elementID, elementTime, 'previous')
            .then((element) => {
                const id = (conversationMode) ? (element.ConversationID || element.ID) : element.ID;
                $state.go(current, { id });
                $scope.markedElement = element;
                $rootScope.$emit('elements', { type: 'switchTo.previous.success', data: element });
            })
            .catch((data) => {
                $rootScope.$emit('elements', { type: 'switchTo.previous.error', data });
            });
    }

    /**
     * Mark conversations selected as read
     */
    $scope.read = () => {
        const type = getTypeSelected();
        const ids = idsSelected();

        if (type === 'conversation') {
            actionConversation.read(ids);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'read', data: { ids } });
        }
    };

    /**
     * Mark conversations selected as unread
     */
    $scope.unread = () => {
        const type = getTypeSelected();
        const ids = idsSelected();

        if (type === 'conversation') {
            actionConversation.unread(ids);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'unread', data: { ids } });
        }

        if (angular.isDefined($state.params.id)) {
            $scope.back(true);
        }
    };

    /**
     * Delete elements selected
     */
    $scope.delete = () => {
        const title = gettextCatalog.getString('Delete', null, 'Title');
        const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const type = getTypeSelected();
                    const ids = idsSelected();

                    if (type === 'conversation') {
                        actionConversation.remove(ids);
                    } else if (type === 'message') {
                        $rootScope.$emit('messageActions', { action: 'delete', data: { ids } });
                    }

                    $rootScope.showWelcome = false;
                    $rootScope.numberElementChecked = 0;
                    confirmModal.deactivate();
                    redirectUser();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    function redirectUser() {
        // The default view for all conversations in not the state conversation but inbox
        const name = $state.$current.name;
        const route = name.replace('.element', '');
        // Return to the state and close message
        $state.go(route, { id: '' });
    }

    /**
     * Move conversation to an other location
     * @param {String} mailbox
     */
    $scope.move = (mailbox) => {
        const type = getTypeSelected();
        const ids = idsSelected();
        const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];

        if (ids.length === 0) {
            return;
        }

        $rootScope.numberElementChecked = 0;

        if (type === 'conversation') {
            actionConversation.move(ids, labelID);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'move', data: { ids, labelID } });
        }
    };

    $scope.getElements = () => getElementsSelected();

    /**
     * Complex method to apply labels on element selected
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     * @return {Promise}
     */
    $scope.saveLabels = (labels, alsoArchive) => {
        const type = getTypeSelected();
        const ids = idsSelected();

        if (type === 'conversation') {
            actionConversation.label(ids, labels, alsoArchive);
        } else if (type === 'message') {
            const messages = getElementsSelected();

            $rootScope.$emit('messageActions', { action: 'label', data: { messages, labels, alsoArchive } });
        }
    };

    /**
     * Back to conversation / message list
     * Or to the previous page.
     * @param refresh Boolean refresh the current state without it's id if true
     */
    $scope.back = (refresh = false) => {

        if (refresh) {
            const opt = _.extend({}, $stateParams, { id: null });
            return $state.go($state.$current.name.replace('.element', ''), opt);
        }

        $state.go($state.$current.name.replace('.element', ''), {
            id: null,
            page: ~~$stateParams.page || 1,
            label: $stateParams.label
        });
    };

    /**
     * Close all label dropdown
     */
    $scope.closeLabels = () => {
        $('.pm_dropdown').removeClass('active');
    };

    $scope.displayPaginator = () => !$state.params.id || authentication.user.ViewLayout === 0;

    /**
     * Emulate labels array for the drag and drop
     * @param {String} labelID
     */
    $scope.applyLabels = (labelID) => {
        const labels = [];

        _.each($scope.labels, (label) => {
            if (label.ID === labelID) {
                label.Selected = true;
            }

            labels.push(label);
        });

        $scope.saveLabels(labels, true);
    };

    /**
     * Switch to an other page
     * @param {Integer} page
     */
    function goToPage(type = 'to') {
        $stateParams.page && $scope.selectElements('all', false);
        $scope.page = ~~$stateParams.page || 1;
        paginationModel[type]();
    }

    /**
     * Go to label folder + reset parameters
     * @param {String} labelID
     */
    $scope.goToLabel = (labelID) => {
        const params = { page: undefined, filter: undefined, sort: undefined, label: labelID };

        $state.go('secured.label', params);
    };


    /**
     * open a specific element
     * @param {Object} element - conversation / message
     */
    function openElement(element) {

        // When we swicth to another state it can be undefined
        if (!element) {
            return;
        }

        const params = {};
        const sameView = $state.params.id && $state.params.id === element.ConversationID;

        if (tools.typeView() === 'conversation' && tools.getTypeList() === 'message') {
            params.id = element.ConversationID;
            params.messageID = element.ID;
        } else {
            params.id = element.ID;
            params.messageID = null;
        }

        // Unselect all elements
        $scope.selectElements('all', false);

        // it's possible that the previous conversation or message
        // had embedded images, and as blob URLs never get deallocated automatically
        // we may trigger a deallocation process to avoid a memory leak.
        embedded.deallocator(element);

        // reset the attachement storage
        AttachmentLoader.flushCache();

        // Mark this element
        $scope.markedElement = element;

        if (sameView) {
            return $rootScope.$emit('message.open', {
                type: 'toggle',
                data: {
                    message: element,
                    action: 'openElement'
                }
            });
        }
        const route = $state.$current.name.replace('.element', '');
        $state.go(route + '.element', params);
    }

    // Call initialization
    initialization();
});
