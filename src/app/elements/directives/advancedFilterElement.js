import _ from 'lodash';

/* @ngInject */
function advancedFilterElement(
    $rootScope,
    $stateParams,
    CONSTANTS,
    gettextCatalog,
    messageApi,
    confirmModal,
    labelsModel,
    networkActivityTracker,
    cache,
    notification,
    eventManager,
    $state
) {
    const getClass = (name) => `advancedFilterElement-${name}`;
    const { MAILBOX_IDENTIFIERS } = CONSTANTS;
    const ACTIVE_CLASS = 'active';
    const BUTTONS_CLASS = {
        [getClass('btn-small-to-large')]: () => $stateParams.sort === 'size',
        [getClass('btn-large-to-small')]: () => $stateParams.sort === '-size',
        [getClass('btn-old-to-new')]: () => $stateParams.sort === 'date',
        [getClass('btn-new-to-old')]: () => !$stateParams.sort || $stateParams.sort === '-date',
        [getClass('btn-show-all')]: () => (!$stateParams.sort || $stateParams.sort === '-date') && !$stateParams.filter,
        [getClass('btn-unread')]: () => $stateParams.filter === 'unread',
        [getClass('btn-read')]: () => $stateParams.filter === 'read'
    };
    const clearState = (state) => state.replace('.element', '');
    const switchState = (opt = {}) => {
        $state.go(
            clearState($state.$current.name),
            _.extend(
                {},
                $state.params,
                {
                    page: undefined,
                    id: undefined
                },
                opt
            )
        );
    };

    /**
     * Empty specific location
     * @param {String} mailbox
     */
    const empty = (mailbox) => {
        const title = gettextCatalog.getString('Delete all', null, 'Title');
        const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');

        if (['drafts', 'spam', 'trash', 'folder'].indexOf(mailbox) === -1) {
            return;
        }

        const labelID = $stateParams.label || MAILBOX_IDENTIFIERS[mailbox];
        const MAP_ACTIONS = {
            drafts: 'emptyDraft',
            spam: 'emptySpam',
            trash: 'emptyTrash',
            folder: 'emptyLabel'
        };

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    // Back to the origin before to clear the folder
                    // https://github.com/ProtonMail/Angular/issues/5901
                    if ($state.includes('**.element')) {
                        $state.go($state.$current.name.replace('.element', ''));
                    }

                    const promise = messageApi[MAP_ACTIONS[mailbox]](labelID).then(() => {
                        cache.empty(labelID);
                        confirmModal.deactivate();
                        notification.success(gettextCatalog.getString('Folder emptied', null));

                        return eventManager.call();
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
    const clearFilter = () => switchState({ filter: undefined, sort: undefined });

    const toggleTrashSpam = () =>
        switchState({
            trashspam: angular.isDefined($state.params.trashspam) ? undefined : 0
        });

    const ACTIONS = { empty, orderBy, filterBy, clearFilter, toggleTrashSpam };

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/advancedFilterElement.tpl.html'),
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

            const bindClass = () => {
                const labelID = $stateParams.label;
                const action = labelID && labelsModel.read(labelID, 'folders') ? 'add' : 'remove';

                el[0].classList[action]('advancedFilterElement-state-folder');
            };

            const unsubscribe = $rootScope.$on('$stateChangeSuccess', bindClass);

            bindClass();

            $btns.on('click', onClick);
            scope.$on('$destroy', () => {
                $btns.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default advancedFilterElement;
