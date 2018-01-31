import _ from 'lodash';

/* @ngInject */
function contactList($filter, dispatchers, $state, $stateParams, contactCache, hotkeys, $rootScope, messageModel) {
    const HEADER_HEIGHT = 120;
    const ITEM_CLASS = 'contactList-item';
    const ACTIVE_CLASS = 'contactList-item-activeContact';
    const ACTIVE_CURSOR_CLASS = 'contactList-item-activeCursorContact';

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactList.tpl.html'),
        link(scope, element) {
            const { dispatcher, on, unsubscribe } = dispatchers(['contacts', '$stateChangeSuccess']);
            let lastChecked = null;
            let isLoadedContact = !!$stateParams.id;
            let cursorID = null;

            scope.contacts = [];
            scope.showContact = (contactID) => $state.go('secured.contacts.details', { id: contactID });

            const setContactCursor = (id) => {
                cursorID = id;

                const $items = element.find(`.${ITEM_CLASS}`);
                $items.removeClass(ACTIVE_CURSOR_CLASS);

                const $row = element.find(`.${ITEM_CLASS}[data-contact-id="${unescape(cursorID)}"]`);
                $row.addClass(ACTIVE_CURSOR_CLASS);
            };

            function updateContacts() {
                const filteredContacts = contactCache.paginate(contactCache.get('filtered'));

                scope.$applyAsync(() => {
                    scope.contacts = filteredContacts;

                    _.defer(() => {
                        activeContact(isLoadedContact);
                        isLoadedContact = false;

                        if (cursorID === null && filteredContacts.length > 0) {
                            setContactCursor(filteredContacts[0].ID);
                        }
                    }, 1000);
                });
            }

            function activeContact(scroll = false) {
                const $items = element.find(`.${ITEM_CLASS}`);
                $items.removeClass(ACTIVE_CLASS);
                $items.removeClass(ACTIVE_CURSOR_CLASS);

                if ($stateParams.id) {
                    const $row = element.find(`.${ITEM_CLASS}[data-contact-id="${unescape($stateParams.id)}"]`);
                    $row.addClass(ACTIVE_CLASS);
                    $row.addClass(ACTIVE_CURSOR_CLASS);

                    cursorID = $stateParams.id;

                    // Scroll the first load
                    if (scroll && $row[0]) {
                        element.animate({ scrollTop: $row.offset().top - HEADER_HEIGHT }, 1000);
                    }
                }
            }

            const selectContact = (contact, isChecked, shiftKey) => {
                const contactIDs = [contact.ID];

                if (!lastChecked) {
                    lastChecked = contact;
                } else {
                    if (shiftKey) {
                        const start = scope.contacts.indexOf(contact);
                        const end = _.findIndex(scope.contacts, { ID: lastChecked.ID });
                        const col = scope.contacts.slice(Math.min(start, end), Math.max(start, end) + 1);
                        contactIDs.push(..._.map(col, 'ID'));
                    }

                    lastChecked = contact;
                }
                dispatcher.contacts('selectContacts', { contactIDs, isChecked });
            };

            const setContactSelection = (ID, checked, shiftKey) => {
                return scope.$applyAsync(() => {
                    const contact = _.find(scope.contacts, { ID });
                    selectContact(contact, checked, shiftKey);
                });
            };

            const onNextPrevElement = (type) => () => {
                const index = _.findIndex(scope.contacts, { ID: cursorID }) || 0;
                const pos = type === 'DOWN' ? index + 1 : index - 1;

                // Last item
                if (type === 'DOWN' && pos === scope.contacts.length) {
                    return;
                }

                // First item
                if (type === 'UP' && pos < 0) {
                    return;
                }

                const { ID } = scope.contacts[pos];
                setContactCursor(ID);

                const $items = element.find(`.${ITEM_CLASS}`);
                const $row = element.find(`.${ITEM_CLASS}[data-contact-id="${unescape(cursorID)}"]`);

                if ($row.offset()) {
                    if ($row.offset().top > element[0].clientHeight) {
                        element[0].scrollTop += $items.height();
                    } else if ($row.offset().top < HEADER_HEIGHT + $items.height()) {
                        element[0].scrollTop -= $items.height();
                    }
                } else {
                    element.animate({ scrollTop: pos * $items.height() - HEADER_HEIGHT }, {
                        duration: 500,
                        complete: () => setContactCursor(ID)
                    });
                }
            };

            function onClick(e) {
                const { target, shiftKey } = e;

                if (/customCheckbox/.test(target.className)) {
                    e.stopPropagation();
                    setContactSelection(target.dataset.contactId, target.checked, shiftKey);
                }

                const action = target.getAttribute('data-action');

                if (action === 'showContact') {
                    $state.go('secured.contacts.details', { id: target.dataset.contactId });
                }

                if (action === 'toggleSort') {
                    const sort = target.getAttribute('data-sort');
                    const prefix = ($stateParams.sort || '').startsWith('-') ? '' : '-';
                    $state.go('secured.contacts', { sort: `${prefix}${sort}` });
                }
            }

            // Open the current contact
            const openContact = () => {
                // Open the contact
                $state.go('secured.contacts.details', { id: cursorID });

                hotkeys.bind('mod+s');
                // We don't need to check these events if we didn't choose to focus onto a specific message
                hotkeys.unbind(['down', 'up']);
            };

            on('contacts', (event, { type = '' }) => {
                type === 'contactsUpdated' && scope.$applyAsync(() => updateContacts());
            });

            on('$stateChangeSuccess', () => {
                scope.$applyAsync(() => activeContact());
            });

            element.on('click', onClick);
            contactCache.hydrate();

            on('right', openContact);

            on('openMarked', openContact);

            // Restore them to allow custom keyboard navigation
            on('left', () => {
                document.activeElement.blur();
                hotkeys.bind(['down', 'up']);
                hotkeys.unbind(['mod+s']);
            });

            // Move to trash
            on('move', (e, type) => {
                if (type === 'trash') {
                    dispatcher.contacts('deleteContacts', { contactIDs: [cursorID] });
                } else if (type === 'archive') {
                    dispatcher.contacts('addContact');
                }
            });

            // Goes up
            on('markPrevious', onNextPrevElement('UP'));

            // Goes down
            on('markNext', onNextPrevElement('DOWN'));

            on('composer.update', (e, { type = '' }) => {
                if (type === 'close') {
                    hotkeys.bind(['down', 'up']);
                }
            });

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default contactList;
