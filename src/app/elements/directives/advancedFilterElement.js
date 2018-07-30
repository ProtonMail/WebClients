import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function advancedFilterElement(
    $stateParams,
    dispatchers,
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

        if (['drafts', 'allDrafts', 'spam', 'trash', 'folder', 'label'].indexOf(mailbox) === -1) {
            return;
        }

        const labelID = $stateParams.label || MAILBOX_IDENTIFIERS[mailbox];
        const MAP_ACTIONS = {
            drafts: 'emptyDraft',
            allDrafts: 'emptyAllDraft',
            spam: 'emptySpam',
            trash: 'emptyTrash',
            folder: 'emptyLabel',
            label: 'emptyLabel'
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
            const { on, unsubscribe } = dispatchers();
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
                const folderAction = labelID && labelsModel.read(labelID, 'folders') ? 'add' : 'remove';
                const labelAction = labelID && labelsModel.read(labelID, 'labels') ? 'add' : 'remove';

                el[0].classList[folderAction]('advancedFilterElement-state-folder');
                el[0].classList[labelAction]('advancedFilterElement-state-label');
            };

            on('$stateChangeSuccess', bindClass);

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
