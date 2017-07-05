angular.module('proton.elements')
    .directive('advancedFilterElement', ($stateParams, gettextCatalog, messageApi, confirmModal, networkActivityTracker, cache, notify, eventManager, $state) => {
        const ACTIVE_CLASS = 'active';
        const BUTTONS_CLASS = {
            'advancedFilterElement-btn-small-to-large': () => $stateParams.sort === 'size',
            'advancedFilterElement-btn-large-to-small': () => $stateParams.sort === '-size',
            'advancedFilterElement-btn-old-to-new': () => !$stateParams.sort || $stateParams.sort === '-date',
            'advancedFilterElement-btn-new-to-old': () => $stateParams.sort === 'date',
            'advancedFilterElement-btn-show-all': () => (!$stateParams.sort || $stateParams.sort === '-date') && !$stateParams.filter,
            'advancedFilterElement-btn-unread': () => $stateParams.filter === 'unread',
            'advancedFilterElement-btn-read': () => $stateParams.filter === 'read'
        };
        const clearState = (state) => state.replace('.element', '');
        const switchState = (opt = {}) => $state.go(clearState($state.$current.name), _.extend({}, $state.params, { page: undefined, id: undefined }, opt));

        /**
         * Empty specific location
         * @param {String} mailbox
         */
        const empty = (mailbox) => {

            const title = gettextCatalog.getString('Delete all', null, 'Title');
            const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');
            const errorMessage = gettextCatalog.getString('Empty request failed', null, 'Error shows when the empty folder request failed');

            if (['drafts', 'spam', 'trash'].indexOf(mailbox) === -1) {
                return;
            }

            const MAP_ACTIONS = {
                drafts: 'emptyDraft',
                spam: 'emptySpam',
                trash: 'emptyTrash'
            };

            confirmModal.activate({
                params: {
                    title, message,
                    confirm() {
                        const promise = messageApi[MAP_ACTIONS[mailbox]]()
                            .then(({ data = {} } = {}) => {
                                if (data.Code === 1000) {
                                    cache.empty(mailbox);
                                    confirmModal.deactivate();
                                    notify({ message: gettextCatalog.getString('Folder emptied', null), classes: 'notification-success' });
                                    return eventManager.call();
                                }
                                throw new Error(data.Error || errorMessage);
                            });
                        networkActivityTracker.track(promise);
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        /**
         * Order the list by a specific parameter
         * @param {String} criterion
         */
        const orderBy = (sort) => switchState({ sort: sort === '-date' ? undefined : sort });

        /**
         * Filter current list
         * @param {String}
         */
        const filterBy = (filter) => switchState({ filter });

        /**
         * Clear current filter
         */
        const clearFilter = () => switchState({ filter: undefined });

        const toggleTrashSpam = () => switchState({
            trashspam: angular.isDefined($state.params.trashspam) ? undefined : 0
        });

        const ACTIONS = { empty, orderBy, filterBy, clearFilter, toggleTrashSpam };

        return {
            replace: true,
            templateUrl: 'templates/elements/advancedFilterElement.tpl.html',
            link(scope, el) {
                const $btns = el.find('button');
                const onClick = (e) => {
                    e.preventDefault();
                    const action = e.target.getAttribute('data-action');
                    action && ACTIONS[action](e.target.getAttribute('data-action-arg'));
                };

                _.each($btns, (button) => {
                    const cssClass = button.classList.item(0);
                    BUTTONS_CLASS[cssClass] && BUTTONS_CLASS[cssClass]() && button.classList.add(ACTIVE_CLASS);
                });

                $btns.on('click', onClick);
                scope.$on('$destroy', () => $btns.off('click', onClick));
            }
        };
    });
