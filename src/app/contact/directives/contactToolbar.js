angular.module('proton.contact')
    .directive('contactToolbar', ($rootScope, $state, $stateParams, CONSTANTS, contactCache, gettextCatalog, messageModel, notification, dispatchers) => {

        const getList = () => {
            if (contactCache.get('selected').length) {
                return contactCache.get('selected');
            }
            return [ contactCache.getItem($stateParams.id) ].filter(Boolean);
        };

        function composeSelectedContacts(dispatcher) {

            const list = getList()
                .filter(({ Emails = [] }) => Emails.length)
                .map(({ Emails, Name }) => ({ Address: Emails[0].Email, Name }));

            if (list.length) {
                const message = messageModel();
                message.ToList = list;
                return dispatcher['composer.new']('new', { message });
            }

            notification.error(gettextCatalog.getString('Contact does not contain email address', null, 'Error'));
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/contact/contactToolbar.tpl.html',
            link(scope, element) {

                const { on, unsubscribe, dispatcher } = dispatchers([ 'composer.new', 'contacts', '$stateChangeSuccess' ]);

                scope.numPerPage = CONSTANTS.CONTACTS_PER_PAGE;
                scope.selectPage = (page) => $state.go($state.$current.name, { page });
                scope.currentPage = +($stateParams.page || 1);
                scope.selectAll = (event) => {
                    const contactIDs = _.pluck(contactCache.paginate(contactCache.get('filtered')), 'ID');
                    dispatcher.contacts('selectContacts', {
                        contactIDs,
                        isChecked: !!event.target.checked
                    });
                };

                function update() {
                    const paginatedContacts = contactCache.paginate(contactCache.get('filtered'));
                    const selectedContacts = contactCache.get('selected');
                    const checkedContacts = _.where(paginatedContacts, { selected: true });

                    scope.$applyAsync(() => {
                        scope.totalItems = contactCache.total();
                        scope.disabled = !paginatedContacts.length;
                        scope.noSelection = !($stateParams.id || selectedContacts.length);
                        scope.checkAll = paginatedContacts.length === checkedContacts.length;
                    });
                }

                function onClick({ target }) {
                    const type = target.getAttribute('data-action');

                    (type === 'composeSelectedContacts') && composeSelectedContacts(dispatcher);
                    if (type === 'deleteSelectedContacts') {
                        return dispatcher.contacts('deleteContacts', {
                            contactIDs: _.pluck(getList(), 'ID')
                        });
                    }

                    if (type === 'addContact' || /^(merge|export|import)Contacts$/.test(type)) {
                        return dispatcher.contacts(type);
                    }
                }

                on('contacts', (e, { type }) => {
                    (type === 'contactsUpdated' || type === 'selectContacts') && update();
                });

                on('$stateChangeSuccess', (e, state) => {
                    (state.name === 'secured.contacts.details' && scope.noSelection) && update();
                });


                element.on('click', onClick);

                update();

                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                    unsubscribe();
                });
            }
        };
    });
