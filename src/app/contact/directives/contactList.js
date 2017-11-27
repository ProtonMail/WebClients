angular.module('proton.contact')
    .directive('contactList', ($filter, $rootScope, $state, $stateParams, contactCache) => {

        const HEADER_HEIGHT = 120;
        const ITEM_CLASS = 'contactList-item';
        const ACTIVE_CLASS = 'contactList-item-activeContact';

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/contact/contactList.tpl.html',
            link(scope, element) {

                let lastChecked = null;
                const unsubscribe = [];
                let isLoadedContact = !!$stateParams.id;

                scope.contacts = [];
                scope.showContact = (contactID) => $state.go('secured.contacts.details', { id: contactID });

                function updateContacts() {
                    const filteredContacts = contactCache.paginate(contactCache.get('filtered'));

                    scope.$applyAsync(() => {
                        scope.contacts = filteredContacts;
                        _.defer(() => {
                            activeContact(isLoadedContact);
                            isLoadedContact = false;
                        }, 1000);
                    });
                }

                function activeContact(scroll = false) {
                    const $items = element.find(`.${ITEM_CLASS}`);
                    $items.removeClass(ACTIVE_CLASS);

                    if ($stateParams.id) {
                        const $row = element.find(`.${ITEM_CLASS}[data-contact-id="${$stateParams.id}"]`);
                        $row.addClass(ACTIVE_CLASS);
                        // Scroll the first load
                        if (scroll && $row[0]) {
                            element.animate({ scrollTop: $row.offset().top - HEADER_HEIGHT }, 1000);
                        }
                    }
                }

                const selectContact = (contact, isChecked, shiftKey) => {
                    const contactIDs = [ contact.ID ];

                    if (!lastChecked) {
                        lastChecked = contact;
                    } else {
                        if (shiftKey) {
                            const start = scope.contacts.indexOf(contact);
                            const end = _.findIndex(scope.contacts, { ID: lastChecked.ID });
                            const col = scope.contacts.slice(Math.min(start, end), Math.max(start, end) + 1);
                            contactIDs.push(..._.pluck(col, 'ID'));
                        }

                        lastChecked = contact;
                    }

                    $rootScope.$emit('contacts', {
                        type: 'selectContacts',
                        data: { contactIDs, isChecked }
                    });
                };

                const setContactSelection = (ID, checked, shiftKey) => {
                    return scope.$applyAsync(() => {
                        const contact = _.findWhere(scope.contacts, { ID });
                        selectContact(contact, checked, shiftKey);
                    });
                };

                function onClick(e) {

                    const { target, shiftKey } = e;

                    if (/customCheckbox/.test(target.className)) {
                        e.stopPropagation();
                        setContactSelection(target.dataset.contactId, target.checked, shiftKey);
                    }

                    const action = target.getAttribute('data-action');

                    if (action === 'showContact') {
                        if (contactCache.get('selected').length) {
                            setContactSelection(target.dataset.contactId, true);
                        }

                        $state.go('secured.contacts.details', { id: target.dataset.contactId });
                    }

                    if (action === 'toggleSort') {
                        const sort = target.getAttribute('data-sort');
                        const prefix = ($stateParams.sort || '').startsWith('-') ? '' : '-';
                        $state.go('secured.contacts', { sort: `${prefix}${sort}` });
                    }
                }

                element.on('click', onClick);
                unsubscribe.push($rootScope.$on('contacts', (event, { type = '' }) => {
                    (type === 'contactsUpdated') && scope.$applyAsync(() => updateContacts());
                }));

                unsubscribe.push($rootScope.$on('$stateChangeSuccess', () => {
                    scope.$applyAsync(() => activeContact());
                }));

                contactCache.hydrate();

                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
