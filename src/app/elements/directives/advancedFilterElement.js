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
        $state.go(clearState($state.$current.name), {
            ...$state.params,
            page: undefined,
            id: undefined,
            ...opt
        });
    };

    /**
     * Empty specific location
     * @param {String} mailbox
     */
    const empty = (mailbox) => {
        const title = gettextCatalog.getString('Delete all', null, 'Title');
        const message = gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info');

        if (!['drafts', 'allDrafts', 'spam', 'trash', 'folder', 'label'].includes(mailbox)) {
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
                async confirm() {
                    const promise = messageApi[MAP_ACTIONS[mailbox]](labelID).then(eventManager.call);
                    await networkActivityTracker.track(promise);
                    cache.empty(labelID);
                    confirmModal.deactivate();
                    notification.success(gettextCatalog.getString('Folder emptied', null, 'Success'));
                    /*
                        Back to the origin before to clear the folder
                        https://github.com/ProtonMail/Angular/issues/5901
                     */
                    if ($state.includes('**.element')) {
                        $state.go($state.$current.name.replace('.element', ''));
                    }
                }
            }
        });
    };

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

    const ACTIONS = { empty, filterBy, clearFilter, toggleTrashSpam };

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/elements/advancedFilterElement.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            scope.title = gettextCatalog.getString('Plus', null, 'Label drodpdown');

            const onClick = (e) => {
                if (e.target.nodeName !== 'BUTTON') {
                    return;
                }

                e.preventDefault();
                const action = e.target.getAttribute('data-action');
                action && ACTIONS[action](e.target.getAttribute('data-action-arg'));
            };

            const bindClass = () => {
                const labelID = $stateParams.label;
                const folderAction = labelID && labelsModel.read(labelID, 'folders') ? 'add' : 'remove';
                const labelAction = labelID && labelsModel.read(labelID, 'labels') ? 'add' : 'remove';

                el[0].classList[folderAction]('advancedFilterElement-state-folder');
                el[0].classList[labelAction]('advancedFilterElement-state-label');
            };

            on('$stateChangeSuccess', bindClass);

            scope.$applyAsync(() => {
                _.each(el.find('button'), (button) => {
                    const cssClass = [...button.classList].find((className) => /advancedFilterElement/.test(className));
                    BUTTONS_CLASS[cssClass] &&
                        BUTTONS_CLASS[cssClass]() &&
                        button.parentElement.classList.add(ACTIVE_CLASS);
                });
                bindClass();
            });

            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default advancedFilterElement;
