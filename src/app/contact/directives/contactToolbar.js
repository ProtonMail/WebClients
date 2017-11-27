angular.module('proton.contact')
    .directive('contactToolbar', ($rootScope, $state, $stateParams, aboutClient, CONSTANTS, contactCache, gettextCatalog, messageModel, notification, listeners) => {

        const getList = () => {
            if (contactCache.get('selected').length) {
                return contactCache.get('selected');
            }
            return [ contactCache.getItem($stateParams.id) ].filter(Boolean);
        };

        function onClick(event) {
            const type = event.target.getAttribute('data-action');

            switch (type) {
                case 'deleteSelectedContacts':
                    $rootScope.$emit('contacts', {
                        type: 'deleteContacts',
                        data: {
                            contactIDs: _.pluck(getList(), 'ID')
                        }
                    });
                    break;
                case 'composeSelectedContacts':
                    composeSelectedContacts();
                    break;
                case 'addContact':
                case 'mergeContacts':
                case 'exportContacts':
                case 'importContacts':
                    $rootScope.$emit('contacts', { type });
                    break;
                default:
                    break;
            }
        }

        function composeSelectedContacts() {

            const list = getList()
                .filter(({ Emails = [] }) => Emails.length)
                .map(({ Emails, Name }) => ({ Address: Emails[0].Email, Name }));

            if (list.length) {
                const message = messageModel();
                message.ToList = list;
                return $rootScope.$emit('composer.new', { message, type: 'new' });
            }

            notification.error(gettextCatalog.getString('Contact does not contain email address', null, 'Error'));
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/contact/contactToolbar.tpl.html',
            link(scope, element) {

                const { on, unsubscribe } = listeners();

                on('contacts', (event, { type }) => {
                    (type === 'contactsUpdated' || type === 'selectContacts') && update();
                });

                on('$stateChangeSuccess', (e, state) => {
                    (state.name === 'secured.contacts.details' && scope.noSelection) && update();
                });

                scope.numPerPage = CONSTANTS.CONTACTS_PER_PAGE;
                scope.selectPage = (page) => $state.go($state.$current.name, { page });
                scope.currentPage = +($stateParams.page || 1);

                scope.selectAll = (event) => {
                    const contactIDs = _.pluck(contactCache.paginate(contactCache.get('filtered')), 'ID');
                    $rootScope.$emit('contacts', {
                        type: 'selectContacts',
                        data: {
                            contactIDs,
                            isChecked: !!event.target.checked
                        }
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

                element.on('click', onClick);

                update();

                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                    unsubscribe();
                });
            }
        };
    });
