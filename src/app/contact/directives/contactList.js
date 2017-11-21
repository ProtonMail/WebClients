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

                scope.contacts = [];
                scope.showContact = (contactID) => $state.go('secured.contacts.details', { id: contactID });

                function updateContacts() {
                    const filteredContacts = contactCache.paginate(contactCache.get('filtered'));

                    scope.$applyAsync(() => {
                        scope.contacts = filteredContacts;
                        _.defer(() => activeContact(!!$stateParams.id), 1000);
                    });
                }

                function activeContact(scroll = false) {
                    const $items = element.find(`.${ITEM_CLASS}`);

                    $items.removeClass(ACTIVE_CLASS);

                    if ($stateParams.id) {
                        const $row = element.find(`.${ITEM_CLASS}[data-contact-id="${$stateParams.id}"]`);

                        $row.addClass(ACTIVE_CLASS);
                        // Scroll the first load
                        scroll && $row[0] && element.animate({ scrollTop: $row.offset().top - HEADER_HEIGHT }, 1000);
                    }
                }

                function onClick(event) {
                    const action = event.target.getAttribute('data-action');

                    switch (action) {
                        case 'showContact': {
                            const $item = angular.element(event.target).closest(`.${ITEM_CLASS}`);

                            $state.go('secured.contacts.details', { id: $item.attr('data-contact-id') });
                            break;
                        }

                        case 'toggleSort': {
                            const sort = event.target.getAttribute('data-sort');
                            const prefix = ($stateParams.sort || '').startsWith('-') ? '' : '-';

                            $state.go('secured.contacts', { sort: `${prefix}${sort}` });
                            break;
                        }

                        default:
                            break;
                    }
                }

                scope.onSelectContact = (event, contact) => {
                    const isChecked = event.target.checked;
                    const contactIDs = [contact.ID];

                    if (!lastChecked) {
                        lastChecked = contact;
                    } else {
                        if (event.shiftKey) {
                            const start = scope.contacts.indexOf(contact);
                            const end = scope.contacts.indexOf(lastChecked);

                            contactIDs.push(...scope.contacts.slice(Math.min(start, end), Math.max(start, end) + 1).map((contact) => contact.ID));
                        }

                        lastChecked = contact;
                    }

                    $rootScope.$emit('contacts', { type: 'selectContacts', data: { contactIDs, isChecked } });
                };

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
