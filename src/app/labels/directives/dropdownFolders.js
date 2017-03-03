angular.module('proton.labels')
.directive('dropdownFolders', (labelsModel, $rootScope, actionConversation, labelModal, CONSTANTS, gettextCatalog) => {

    const mailboxes = [
        {
            Name: gettextCatalog.getString('Inbox', null),
            ID: CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
            Order: 0,
            className: 'fa-inbox'
        },
        {
            Name: gettextCatalog.getString('Archive', null),
            ID: CONSTANTS.MAILBOX_IDENTIFIERS.archive,
            Order: 0,
            className: 'fa-archive'
        },
        {
            Name: gettextCatalog.getString('Spam', null),
            ID: CONSTANTS.MAILBOX_IDENTIFIERS.spam,
            Order: 0,
            className: 'fa-ban'
        },
        {
            Name: gettextCatalog.getString('Trash', null),
            ID: CONSTANTS.MAILBOX_IDENTIFIERS.trash,
            Order: 0,
            className: 'fa-trash-o'
        }
    ];

    const close = () => $rootScope.$emit('closeDropdown');

    function moveTo(elements = [], type = '', folderID = '') {
        const elementIDs = elements.map(({ ID }) => ID);

        if (type === 'conversation') {
            actionConversation.folder(elementIDs, folderID);
        } else if (type === 'message') {
            $rootScope.$emit('messageActions', { action: 'folder', data: { messageIDs: elementIDs, folderID } });
        }
    }

    function getType(elements = []) {
        if (elements.length) {
            return (typeof elements[0].NumUnread !== 'undefined') ? 'conversation' : 'message';
        }
        return false;
    }

    return {
        restrict: 'E',
        templateUrl: 'templates/labels/dropdownFolders.tpl.html',
        replace: true,
        scope: {
            getElements: '=elements'
        },
        link(scope, element) {
            const dropdown = angular.element(element).closest('.pm_buttons').find('.open-folder');
            const search = element[0].querySelector('.dropdown-folder-search-input');

            function onClickDropdown() {
                const exclusiveLabels = labelsModel.get('folders')
                    .map((folder) => {
                        folder.className = 'fa-folder';
                        return folder;
                    });
                scope.$applyAsync(() => {
                    scope.labels = mailboxes.concat(exclusiveLabels);
                });
                const id = setTimeout(() => (search.focus(), clearTimeout(id)), 100);
            }

            function onClickList(event) {

                if (event.target.tagName !== 'BUTTON') {
                    return;
                }

                if (event.target.classList.contains('dropdown-folder-scrollbox-group-item-button')) {
                    scope.$applyAsync(() => {
                        const folderID = event.target.getAttribute('data-folder-id');
                        const elements = scope.getElements();
                        const type = getType(elements);
                        moveTo(elements, type, folderID);
                        close();
                    });
                }

                if (event.target.classList.contains('dropdown-folder-create-button')) {
                    labelModal.activate({
                        params: {
                            label: { Exclusive: 1 },
                            close() {
                                labelModal.deactivate();
                            }
                        }
                    });
                }
            }

            dropdown.on('click', onClickDropdown);
            element.on('click', onClickList);

            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            scope.$on('$destroy', () => {
                dropdown.off('click', onClickDropdown);
                element.off('click', onClickList);
            });
        }
    };
});
