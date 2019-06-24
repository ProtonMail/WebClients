import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function dropdownFolders(labelsModel, dispatchers, labelModal, gettextCatalog) {
    const MAILBOX_CONFIG = [
        {
            Name: gettextCatalog.getString('Inbox', null, 'Label'),
            ID: MAILBOX_IDENTIFIERS.inbox,
            icon: 'inbox'
        },
        {
            Name: gettextCatalog.getString('Archive', null, 'Label'),
            ID: MAILBOX_IDENTIFIERS.archive,
            icon: 'archive'
        },
        {
            Name: gettextCatalog.getString('Spam', null, 'Label'),
            ID: MAILBOX_IDENTIFIERS.spam,
            icon: 'spam'
        },
        {
            Name: gettextCatalog.getString('Trash', null, 'Label'),
            ID: MAILBOX_IDENTIFIERS.trash,
            icon: 'trash'
        }
    ];

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/labels/dropdownFolders.tpl.html'),
        replace: true,
        link(scope, el) {
            const { dispatcher, on, unsubscribe } = dispatchers(['dropdownApp', 'requestElements', 'messageActions']);
            const dropdownId = el[0].parentElement.getAttribute('data-dropdown-id');

            const clean = () => {
                scope.$applyAsync(() => {
                    scope.searchValue = '';
                });
            };

            const close = () => {
                dispatcher.dropdownApp('action', { type: 'close', id: dropdownId });
                clean();
            };

            function onClickList({ target }) {
                if (target.tagName !== 'BUTTON') {
                    return;
                }

                if (target.hasAttribute('data-folder-id')) {
                    scope.$applyAsync(() => {
                        const folderID = target.getAttribute('data-folder-id');
                        dispatcher.requestElements('moveTo', {
                            folderID
                        });
                        close();
                    });
                }

                if (target.classList.contains('dropdown-folder-create-button')) {
                    labelModal.activate({
                        params: {
                            label: {
                                Name: scope.searchValue,
                                Exclusive: 1
                            }
                        }
                    });
                }
            }

            on('dropdownApp', (e, { type, data = {} }) => {
                if (type === 'state' && data.isOpened) {
                    scope.$applyAsync(() => {
                        scope.labels = labelsModel.get('folders');
                        scope.mailboxes = MAILBOX_CONFIG;

                        const id = setTimeout(() => {
                            const search = el[0].querySelector('.dropdown-folder-search-input');
                            search.focus();
                            clearTimeout(id);
                        }, 100);
                    });
                }

                if (type === 'state' && !data.isOpened) {
                    clean();
                }
            });

            el.on('click', onClickList);

            scope.color = ({ Color: color = 'inherit' } = {}, key = 'color') => ({ [key]: color });

            scope.$on('$destroy', () => {
                el.off('click', onClickList);
                unsubscribe();
            });
        }
    };
}
export default dropdownFolders;
