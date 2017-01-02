angular.module('proton.elements')
    .directive('advancedFilterElement', (gettextCatalog, Message, confirmModal, networkActivityTracker, cache, notify, eventManager, $state) => {

        const switchState = (opt = {}) => $state.go($state.$current.name, _.extend({}, $state.params, { page: undefined }, opt));

        /**
         * Empty specific location
         * @param {String} mailbox
         */
        const empty = (mailbox) => {

            const title = gettextCatalog.getString('Delete all', null, 'Title');
            const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');

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
                        const promise = Message[MAP_ACTIONS[mailbox]]().$promise
                            .then((response) => {
                                if (response.Code === 1000) {
                                    cache.empty(mailbox);
                                    confirmModal.deactivate();
                                    notify({ message: gettextCatalog.getString('Folder emptied', null), classes: 'notification-success' });
                                    eventManager.call();
                                }
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
                $btns.on('click', onClick);

                scope.$on('$destroy', () => {
                    $btns.off('click', onClick);
                });
            }
        };
    });
