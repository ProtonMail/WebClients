angular.module('proton.elements')
.controller('ElementsController', (
    $q,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    $filter,
    $window,
    $cookies,
    actionConversation,
    CONSTANTS,
    Conversation,
    Message,
    eventManager,
    Label,
    authentication,
    cache,
    confirmModal,
    Setting,
    cacheCounters,
    networkActivityTracker,
    AttachmentLoader,
    notify,
    embedded,
    paginationModel,
    tools
) => {
    const unsubscribes = [];
    let unbindWatcherElements;
    $scope.firstLoad = true; // Variable used to determine if it's the first load to force the cache to call back-end result

    $scope.conversations = [];
    /**
     * Method called at the initialization of this controller
     */
    function initialization() {

        // Variables
        $scope.markedElement = undefined;
        $scope.mailbox = tools.currentMailbox();
        $scope.conversationsPerPage = authentication.user.NumMessagePerPage;
        $scope.labels = authentication.user.Labels;
        $scope.messageButtons = authentication.user.MessageButtons;
        $scope.selectedFilter = $stateParams.filter;
        $scope.selectedOrder = $stateParams.sort || '-date';
        $scope.page = parseInt($stateParams.page || 1, 10);
        $scope.startWatchingEvent();
        $scope.refreshElements().then(() => {
            $scope.$applyAsync(actionsDelayed); // If we don't use the timeout, messages seems not available (to unselect for example)
            // I consider this trick like a bug in the angular application
        }, $log.error);
    }

    $scope.watchElements = () => {
        if (angular.isDefined(unbindWatcherElements)) {
            unbindWatcherElements();
        }

        unbindWatcherElements = $scope.$watch('conversations', () => {
            $rootScope.numberElementSelected = $scope.elementsSelected().length;
            $rootScope.numberElementUnread = cacheCounters.unreadConversation(tools.currentLocation());
        }, true);
    };

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
     * Return if we can display the placeholder or not
     * @param {Boolean}
     */
    $scope.placeholder = () => {
        return authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE && ($scope.idDefined() === false || ($scope.idDefined() === true && $rootScope.numberElementChecked > 0));
    };

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
                isOpened = value;
            }
        };

        unsubscribes.push($rootScope.$on('conversation.close', () => {
            isOpened = false;
        }));

        unsubscribes.push($rootScope.$on('refreshElements', () => {
            $scope.refreshElements();
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
            $scope.markedElement.Selected = !$scope.markedElement.Selected;
            $scope.$apply();
        });

        $scope.$on('selectAllElements', () => {
            $scope.selectAllElements();
            $scope.$apply();
        });

        $scope.$on('unselectAllElements', () => {
            $scope.unselectAllElements();
            $scope.$apply();
        });

        $scope.$on('applyLabels', (event, LabelID) => {
            $scope.applyLabels(LabelID);
        });

        $scope.$on('move', (event, name) => {
            !isOpened && $scope.move(name);
        });

        $scope.$on('read', () => {
            !isOpened && $scope.read();
        });

        $scope.$on('unread', () => {
            !isOpened && $scope.unread();
        });

        /**
         * Scroll to the current marked conversation
]        */
        function scrollToConversationPos() {
            const $convRows = document.getElementById('conversation-list-rows');
            const $convCols = document.getElementById('conversation-list-columns');

            if ($convCols) {
                const $marked = $convCols.querySelector('.conversation.marked');
                const scrollTo = (cols, marked) => () => cols.scrollTop = marked.offsetTop - cols.offsetHeight / 2;
                $marked && _rAF(scrollTo($convCols, $marked));
            }

            if ($convRows) {
                const $marked = $convRows.querySelector('.conversation.marked');
                const scrollTo = (rows, marked) => () => rows.scrollTop = marked.offsetTop - rows.offsetHeight / 2;
                $marked && _rAF(scrollTo($convRows, $marked));
            }
        }

        $scope.$on('markPrevious', onElement(() => {
            if ($scope.conversations) {
                const index = $scope.conversations.indexOf($scope.markedElement);

                if (index > 0) {
                    $scope.$applyAsync(() => {
                        $scope.markedElement = $scope.conversations[index - 1];
                    });
                    return scrollToConversationPos();
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
                    return scrollToConversationPos();
                }

                goToPage('next');
            }
        }, false));

        $scope.$on('nextElement', () => {
            $scope.nextElement();
        });

        $scope.$on('previousElement', () => {
            $scope.previousElement();
        });

        $scope.$on('$destroy', () => {
            $scope.stopWatchingEvent();
            unsubscribes.forEach((callback) => callback());
        });
    };

    $scope.stopWatchingEvent = () => {
        angular.element($window).unbind('resize', $rootScope.mobileResponsive);
        angular.element($window).unbind('orientationchange', $rootScope.mobileResponsive);
    };

    function actionsDelayed() {
        $scope.unselectAllElements();

        const $page = $('#page');
        $page.val($scope.page);
        $page.change(() => {
            goToPage();
        });

        if ($rootScope.scrollPosition) {
            $('#content').scrollTop($rootScope.scrollPosition);
            $rootScope.scrollPosition = null;
        }

        $rootScope.$emit('updatePageName');
    }

    $scope.showNextPrev = () => {
        const specialBoxes = ['drafts', 'search', 'sent'];
        const box = tools.currentMailbox();
        const elementID = $state.params.id;
        const rowMode = authentication.user.ViewLayout === CONSTANTS.ROW_MODE;
        const context = tools.cacheContext();
        const notSpecial = specialBoxes.indexOf(box) === -1;
        return elementID && rowMode && context && notSpecial;
    };

    $scope.conversationCount = () => {
        const context = tools.cacheContext();

        if (!context) {
            return $rootScope.Total;
        }

        const label = ($scope.mailbox === 'label') ? $stateParams.label : CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox];

        return (tools.typeList() === 'message') ? cacheCounters.totalMessage(label) : cacheCounters.totalConversation(label);
    };

    $scope.makeDropdownPages = () => {
        const ddp = [];
        const ddp2 = [];
        const count = parseInt($scope.conversationCount() - 1, 10);

        for (let i = 0; i <= count; i++) {
            ddp[i] = i;
        }

        function makeRange(element, index) {
            if (index % CONSTANTS.ELEMENTS_PER_PAGE === 0) {
                ddp2.push((index + 1) + ' - ' + (index + CONSTANTS.ELEMENTS_PER_PAGE));
            }
        }

        ddp.forEach(makeRange);

        return ddp2;
    };

    function forgeRequestParameters(mailbox) {
        const params = {};

        params.Page = ($stateParams.page || 1) - 1;
        params.TrashSpam = $stateParams.trashspam || undefined;

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
        } else if (mailbox === 'label') {
            params.Label = $stateParams.label;
        } else {
            params.Label = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        }

        _.pick(params, _.identity);

        return params;
    }

    $scope.refreshElements = () => {
        const deferred = $q.defer();
        const request = forgeRequestParameters($scope.mailbox);
        const context = tools.cacheContext();
        const type = tools.typeList();
        let promise;

        if (type === 'message') {
            promise = cache.queryMessages(request, $scope.firstLoad);
        } else if (type === 'conversation') {
            promise = cache.queryConversations(request, $scope.firstLoad);
        }

        promise.then((elements) => {
            const page = $stateParams.page || 0;
            const selectedMap = $scope.conversations.reduce((map, element) => {
                if (element.Selected) {
                    map[element.ID] = element;
                }
                return map;
            }, {});
            $scope.conversations = elements.map((element) => {
                element.Selected = typeof selectedMap[element.ID] !== 'undefined';
                return element;
            });
            $scope.watchElements();
            $scope.firstLoad = false;

            if ($scope.conversations.length === 0 && page > 0) {
                $scope.back();
            }

            if ($scope.conversations.length > 0) {
                let element;

                if (!$scope.markedElement) {
                    if ($state.params.id) {
                        element = _.findWhere($scope.conversations, { ID: $state.params.id });
                    } else {
                        element = _.first($scope.conversations);
                    }
                } else {
                    const found = _.findWhere($scope.conversations, { ID: $scope.markedElement.ID });

                    if (found) {
                        element = found;
                    } else {
                        element = _.first($scope.conversations);
                    }
                }

                $scope.markedElement = element;
            }
            $scope.$applyAsync();
            deferred.resolve(elements);
        }, (error) => {
            notify({ message: gettextCatalog.getString('Error during quering conversations', null, 'Error'), classes: 'notification-danger' });
            $log.error(error);
        });

        if (context === false) {
            networkActivityTracker.track(promise);
        }

        return deferred.promise;
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

    $scope.size = (element) => {
        if (angular.isDefined(element.TotalSize)) {
            return element.TotalSize;
        } else if (angular.isDefined(element.Size)) {
            return element.Size;
        }
    };

    /**
     * Return style to color tag label
     * @param {String} id - label id
     * @return {Object} style
     */
    $scope.getColorLabel = (id) => {
        return {
            color: $scope.getLabel(id).Color,
            borderColor: $scope.getLabel(id).Color
        };
    };

    /**
     *
     * @return {}
     */
    $scope.start = () => {
        return ($scope.page - 1) * $scope.conversationsPerPage + 1;
    };

    /**
     *
     * @return {} end
     */
    $scope.end = () => {
        let end = $scope.start() + $scope.conversationsPerPage - 1;

        if (end > $scope.conversationCount()) {
            end = $scope.conversationCount();
        }

        return end;
    };

    /**
     * Return if all elements are selected
     * @return {Boolean}
     */
    $scope.allSelected = () => {
        if (!Array.isArray($scope.conversations) || !$scope.conversations.length) {
            return false;
        }
        return _.every($scope.conversations, { Selected: true });
    };

    /**
     * Unselect all elements
     */
    $scope.unselectAllElements = () => {
        $scope.conversations = _.map($scope.conversations, (element) => {
            element.Selected = false;
            return element;
        });
        $rootScope.numberElementChecked = 0;
    };

    /**
      * Select all elements
      */
    $scope.selectAllElements = () => {
        _.each($scope.conversations, (element) => {
            element.Selected = true;
        });
        $rootScope.numberElementChecked = $scope.conversations.length;
    };

    /**
     * Return [Element] selected
     * @return {Array} elements
     */
    $scope.elementsSelected = () => {
        let elements = _.where($scope.conversations, { Selected: true });

        if ($scope.conversations.length > 0 && elements.length === 0 && $scope.markedElement) {
            const type = tools.typeList();
            if (type === 'message') {
                elements = _.where($scope.conversations, { ID: $scope.markedElement.ID });
            } else if (type === 'conversation') {
                elements = _.where($scope.conversations, { ID: $scope.markedElement.ID });
            }
        }

        if ($state.params.id && authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
            elements = _.where($scope.conversations, { ID: $state.params.id });
        }

        return elements;
    };

    /**
     * Return [IDs]
     * @return {Array}
     */
    function idsSelected() {
        const elementsSelected = $scope.elementsSelected();
        return elementsSelected.map(({ ID }) => ID);
    }

    /**
     * Go to the next conversation
     */
    $scope.nextElement = () => {
        const current = $state.$current.name;
        const elementID = $state.params.id;
        const elementTime = $scope.markedElement.Time;
        const conversationMode = authentication.user.ViewMode === CONSTANTS.CONVERSATION_VIEW_MODE;
        cache.more(elementID, elementTime, 'next')
        .then((element) => {
            const id = (conversationMode) ? (element.ConversationID || element.ID) : element.ID;
            $state.go(current, { id });
            $scope.markedElement = element;
        });
    };

    /**
     * Go to the previous conversation
     */
    $scope.previousElement = () => {
        const current = $state.$current.name;
        const elementID = $state.params.id;
        const elementTime = $scope.markedElement.Time;
        const conversationMode = authentication.user.ViewMode === CONSTANTS.CONVERSATION_VIEW_MODE;
        cache.more(elementID, elementTime, 'previous')
        .then((element) => {
            const id = (conversationMode) ? (element.ConversationID || element.ID) : element.ID;
            $state.go(current, { id });
            $scope.markedElement = element;
        });
    };

    /**
     * Mark conversations selected as read
     */
    $scope.read = () => {
        const type = tools.typeList();
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
        const type = tools.typeList();
        const ids = idsSelected();

        if (type === 'conversation') {
            actionConversation.unread(ids);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'unread', data: { ids } });
        }

        if (angular.isDefined($state.params.id)) {
            $scope.back();
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
                    const type = tools.typeList();
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
        const type = tools.typeList();

        const ids = idsSelected();
        if (ids.length === 0) {
            return;
        }

        $rootScope.numberElementChecked = 0;
        if (type === 'conversation') {
            actionConversation.move(ids, mailbox);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'move', data: { ids, mailbox } });
        }

        redirectUser();
    };

    /**
     * Complex method to apply labels on element selected
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     * @return {Promise}
     */
    $scope.saveLabels = (labels, alsoArchive) => {
        const type = tools.typeList();
        const ids = idsSelected();

        if (type === 'conversation') {
            actionConversation.label(ids, labels, alsoArchive);
        } else if (type === 'message') {
            const messages = $scope.elementsSelected();

            $rootScope.$emit('messageActions', { action: 'label', data: { messages, labels, alsoArchive } });
        }
    };

    /**
     * Back to conversation / message list
     */
    $scope.back = () => {
        $state.go('secured.' + $scope.mailbox, {
            id: null // remove ID
        });
    };

    // Let users change the col/row modes.
    $scope.changeLayout = (mode) => {
        let newLayout;

        if (mode === 'rows' && authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE) {
            newLayout = 1;
        } else if (mode === 'columns' && authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
            newLayout = 0;
        } else if (mode === 'mobile') {
            $rootScope.mobileMode = true;
        }

        if (angular.isDefined(newLayout)) {
            networkActivityTracker.track(
                Setting.setViewlayout({ ViewLayout: newLayout })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        $rootScope.mobileMode = false;
                        return eventManager.call()
                        .then(() => {
                            tools.mobileResponsive();
                            notify({ message: gettextCatalog.getString('Layout saved', null), classes: 'notification-success' });
                        });
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    } else {
                        notify({ message: 'Error during saving layout mode', classes: 'notification-danger' });
                    }
                })
            );
        }

        angular.element('#pm_toolbar-desktop a').tooltip('hide');
    };

    /**
     * Check if the current message is a draft
     * @param {Object} element
     * @return {Boolean}
     */
    $scope.draft = (element) => {
        return angular.isDefined(element.LabelIDs) && element.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
    };

    /**
     * Close all label dropdown
     */
    $scope.closeLabels = () => {
        $('.pm_dropdown').removeClass('active');
    };

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
        $stateParams.page && $scope.unselectAllElements();
        paginationModel.setMaxPage($scope.conversationCount());
        $scope.page = $stateParams.page || 1;
        paginationModel[type]();
    }


    /**
     * Return label object
     * @param {String} id
     */
    $scope.getLabel = (id) => {
        return _.findWhere(authentication.user.Labels, { ID: id });
    };

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
        const view = tools.typeView();
        const list = tools.typeList();
        const name = $state.$current.name;
        const route = name.replace('.element', '');
        const params = {};
        const sameView = $state.params.id && $state.params.id === element.ConversationID;

        if (view === 'conversation' && list === 'message') {
            params.id = element.ConversationID;
            params.messageID = element.ID;
        } else {
            params.id = element.ID;
        }

        // Save scroll position
        $rootScope.scrollPosition = $('#content').scrollTop();
        // Unselect all elements
        $scope.unselectAllElements();

        // it's possible that the previous conversation or message
        // had embedded images, and as blob URLs never get deallocated automatically
        // we may trigger a deallocation process to avoid a memory leak.
        embedded.deallocator(element);

        // reset the attachement storage
        AttachmentLoader.flushCache();

        // Mark this element
        $scope.markedElement = element;

        if (sameView) {
            $rootScope.$emit('message.open', {
                type: 'toggle',
                data: {
                    message: element,
                    action: 'openElement'
                }
            });
        } else {
            $state.go(route + '.element', params);
        }
    }

    /**
     * On click on a conversation
     * @param {Object} element - Conversation or Message
     */
    $scope.click = ($event, element) => {
        // Prevent click onto the selecte checkbox
        if ($event.target && /ptSelectConversation/.test($event.target.className)) {
            return false;
        }

        openElement(element);
    };

    /**
     * Filter current list
     * @param {String}
     */
    $scope.filterBy = (status) => {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            filter: status,
            page: undefined
        }));
    };

    /**
     * Clear current filter
     */
    $scope.clearFilter = () => {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            filter: undefined,
            page: undefined
        }));
    };

    /**
     * Order the list by a specific parameter
     * @param {String} criterion
     */
    $scope.orderBy = (criterion) => {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            sort: criterion === '-date' ? undefined : criterion,
            page: undefined
        }));
    };

    /**
     * Empty specific location
     * @param {String} mailbox
     */
    $scope.empty = (mailbox) => {
        const title = gettextCatalog.getString('Delete all', null, 'Title');
        const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');
        let promise;

        if (['drafts', 'spam', 'trash'].indexOf(mailbox) !== -1) {
            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        if (mailbox === 'drafts') {
                            promise = Message.emptyDraft().$promise;
                        } else if (mailbox === 'spam') {
                            promise = Message.emptySpam().$promise;
                        } else if (mailbox === 'trash') {
                            promise = Message.emptyTrash().$promise;
                        }

                        networkActivityTracker.track(
                            promise.then((response) => {
                                if (response.Code === 1000) {
                                    // Call to empty cache conversation
                                    cache.empty(mailbox);
                                    // Close modal
                                    confirmModal.deactivate();
                                    // Notify user
                                    notify({ message: gettextCatalog.getString('Folder emptied', null), classes: 'notification-success' });
                                    // Call event manager to update the storage space
                                    eventManager.call();
                                }
                            })
                        );
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        }
    };

    // Call initialization
    initialization();
});
