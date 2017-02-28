angular.module('proton.labels')
.directive('dropdownFolders', (authentication, $rootScope, actionConversation, Label, labelModal, CONSTANTS, gettextCatalog) => {
    const mailboxes = [
        { Name: gettextCatalog.getString('Inbox', null), ID: CONSTANTS.MAILBOX_IDENTIFIERS.inbox, Order: 0, className: 'fa-inbox' },
        { Name: gettextCatalog.getString('Archive', null), ID: CONSTANTS.MAILBOX_IDENTIFIERS.archive, Order: 0, className: 'fa-archive' },
        { Name: gettextCatalog.getString('Spam', null), ID: CONSTANTS.MAILBOX_IDENTIFIERS.spam, Order: 0, className: 'fa-ban' },
        { Name: gettextCatalog.getString('Trash', null), ID: CONSTANTS.MAILBOX_IDENTIFIERS.trash, Order: 0, className: 'fa-trash-o' }
    ];
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
            const list = element[0].querySelector('.scrollbox-container-group');
            const search = element[0].querySelector('input[type="search"]');

            function onClickDropdown() {
                const exclusiveLabels = _
                    .chain(authentication.user.Labels)
                    .where({ Exclusive: 1 })
                    .map((folder) => {
                        folder.className = 'fa-folder';
                        return folder;
                    })
                    .value();
                scope.$applyAsync(() => {
                    scope.labels = mailboxes.concat(exclusiveLabels);
                });
                setTimeout(() => search.focus(), 100);
            }

            function onClickList(event) {
                if (event.target.tagName === 'BUTTON') {
                    event.preventDefault();
                    const folderID = event.target.getAttribute('data-folder-id');
                    const elements = scope.getElements();
                    const type = getType(elements);
                    moveTo(elements, type, folderID);
                    scope.close();
                }
            }

            dropdown.on('click', onClickDropdown);
            list.addEventListener('click', onClickList);

            scope.createNewFolder = () => {
                labelModal.activate({
                    params: {
                        label: { Exclusive: 1 },
                        close() {
                            labelModal.deactivate();
                        }
                    }
                });
            };

            scope.close = () => {
                $rootScope.$emit('closeDropdown');
            };

            scope.$on('$destroy', () => {
                dropdown.off('click', onClickDropdown);
                list.removeEventListener('click', onClickList);
            });
        }
    };
});
