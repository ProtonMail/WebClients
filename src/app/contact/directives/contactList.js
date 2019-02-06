import _ from 'lodash';

/* @ngInject */
function contactList($filter, dispatchers, $state, $stateParams, contactCache, hotkeys) {
    const HEADER_HEIGHT = 120;

    const CLASSNAMES = {
        ITEM: 'contactList-item',
        ACTIVE: 'contactList-item-activeContact',
        ACTIVE_CURSOR: 'contactList-item-activeCursorContact',
        LOADED: 'contactList-loaded',
        CHECKBOX: '.customCheckbox-input'
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactList.tpl.html'),
        link(scope, element) {
            const { dispatcher, on, unsubscribe } = dispatchers(['contacts']);
            let lastChecked = null;
            let isLoadedContact = !!$stateParams.id;
            const MODEL = {
                cursorID: null
            };

            scope.contacts = [];
            scope.showContact = (contactID) => $state.go('secured.contacts.details', { id: contactID });
            scope.isSelected = ({ ID }) => ID === MODEL.cursorID;
            scope.isActive = ({ ID }) => ID === $stateParams.id;

            const paginatedContacts = () => contactCache.paginate(contactCache.get('filtered'));

            const setContactCursor = (id, $items) => {
                MODEL.cursorID = id;

                const $rows = $items || element.find(`.${CLASSNAMES.ITEM}`);
                const $row = $rows.has(`[data-contact-id="${unescape(MODEL.cursorID)}"]`);
                const isCurrentActive = $stateParams.id === id;

                // Focus the checkbox to toggle it with the "space" key
                if ($row[0]) {
                    // Ensure we run the $digest to refesh isActive
                    scope.$applyAsync(() => {
                        isCurrentActive && $row[0].classList.add(CLASSNAMES.ACTIVE);
                        $row[0].querySelector(CLASSNAMES.CHECKBOX).focus();
                    });
                }
            };

            function updateContacts() {
                const filteredContacts = paginatedContacts();

                scope.$applyAsync(() => {
                    scope.contacts = filteredContacts;

                    if (!element[0].classList.contains(CLASSNAMES.LOADED)) {
                        element[0].classList.add(CLASSNAMES.LOADED);
                    }

                    _.defer(() => {
                        activeContact(isLoadedContact);
                        isLoadedContact = false;

                        if (!MODEL.cursorID && filteredContacts.length > 0) {
                            setContactCursor(filteredContacts[0].ID);
                        }
                    }, 1000);
                });
            }

            function activeContact(scroll = false) {
                const $items = element.find(`.${CLASSNAMES.ITEM}`);
                $items.removeClass(CLASSNAMES.ACTIVE);

                if ($stateParams.id) {
                    const $row = element.find(`.${CLASSNAMES.ITEM}[data-contact-id="${unescape($stateParams.id)}"]`);

                    const filteredContacts = paginatedContacts();
                    const selectedContacts = filteredContacts.filter((c) => c.selected);

                    // Only add the active class if 0 contacts are tick
                    if (!selectedContacts.length) {
                        $row.addClass(CLASSNAMES.ACTIVE);
                    }

                    if (!MODEL.cursorID) {
                        MODEL.cursorID = $stateParams.id;
                    }

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

            const onNextPrevElement = (type) =>
                _.throttle(() => {
                    const index = _.findIndex(scope.contacts, { ID: MODEL.cursorID }) || 0;
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
                    const $items = element.find(`.${CLASSNAMES.ITEM}`);
                    const $row = $items.has(`[data-contact-id="${unescape(MODEL.cursorID)}"]`);
                    setContactCursor(ID, $items);

                    if ($row.offset()) {
                        if ($row.offset().top > element[0].clientHeight) {
                            element[0].scrollTop += $items.height();
                        } else if ($row.offset().top < HEADER_HEIGHT + $items.height()) {
                            element[0].scrollTop -= $items.height();
                        }
                    } else {
                        element.animate(
                            { scrollTop: pos * $items.height() - HEADER_HEIGHT },
                            {
                                duration: 500,
                                complete: () => setContactCursor(ID)
                            }
                        );
                    }
                }, 50);

            function onClick(e) {
                const { target, shiftKey } = e;

                // Indicates if there is currently any text selected
                if (!window.getSelection().isCollapsed) {
                    return e.preventDefault();
                }

                if (target.classList.contains(CLASSNAMES.CHECKBOX.slice(1))) {
                    e.stopPropagation();
                    setContactSelection(target.dataset.contactId, target.checked, shiftKey);
                }

                const action = target.getAttribute('data-action');

                if (action === 'showContact') {
                    setContactCursor(target.dataset.contactId);
                    dispatcher.contacts('selectContacts', { isChecked: false });
                    $state.go('secured.contacts.details', { id: target.dataset.contactId });
                }

                if (action === 'toggleSort') {
                    const sort = target.getAttribute('data-sort');
                    const prefix = ($stateParams.sort || '').startsWith('-') ? '' : '-';
                    $state.go('secured.contacts', { sort: `${prefix}${sort}` });
                }
            }

            const openContact = () => {
                $state.go('secured.contacts.details', { id: MODEL.cursorID });

                hotkeys.bind(['mod+s']);
                // We don't need to check these events if we didn't choose to focus onto a specific message
                hotkeys.unbind(['down', 'up']);
            };

            on('contacts', (event, { type = '' }) => {
                type === 'contactsUpdated' && scope.$applyAsync(() => updateContacts());
                type === 'deletedContactEmail' && delete MODEL.cursorID;
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
                $state.go('secured.contacts');
                hotkeys.bind(['down', 'up']);
                hotkeys.unbind(['mod+s']);
            });

            // Move to trash
            on('hotkeys', (e, { type, data: { to } }) => {
                if (type === 'move' && to === 'trash' && MODEL.cursorID) {
                    dispatcher.contacts('deleteContacts', { contactIDs: [MODEL.cursorID] });
                }

                if (type === 'move' && to === 'archive') {
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
