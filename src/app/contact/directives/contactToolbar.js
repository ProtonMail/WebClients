angular.module('proton.contact')
    .directive('contactToolbar', ($rootScope, $state, $stateParams, aboutClient, CONSTANTS, contactCache, gettextCatalog, messageModel, notification) => {
        function onClick(event) {
            const type = event.target.getAttribute('data-action');

            switch (type) {
                case 'deleteSelectedContacts':
                    $rootScope.$emit('contacts', { type: 'deleteContacts', data: { contactIDs: contactCache.get('selected').map(({ ID }) => ID) } });
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
            const contactsSelected = contactCache.get('selected');
            const message = messageModel();
            const list = contactsSelected
                .filter(({ Emails }) => Emails.length)
                .map(({ Emails, Name }) => ({ Address: Emails[0].Email, Name }));


            if (list.length) {
                message.ToList = list;
                $rootScope.$emit('composer.new', { message, type: 'new' });
            } else {
                notification.error(gettextCatalog.getString('Contact does not contain email address', null, 'Error'));
            }
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/contact/contactToolbar.tpl.html',
            link(scope, element) {
                const unsubscribe = $rootScope.$on('contacts', (event, { type }) => {
                    (type === 'contactsUpdated') && update();
                });

                scope.numPerPage = CONSTANTS.CONTACTS_PER_PAGE;
                scope.selectPage = (page) => $state.go($state.$current.name, { page });
                scope.currentPage = Number($stateParams.page || 1);
                scope.selectAll = (event) => {
                    const contactIDs = contactCache.paginate(contactCache.get('filtered')).map(({ ID }) => ID);
                    $rootScope.$emit('contacts', { type: 'selectContacts', data: { contactIDs, isChecked: !!event.target.checked } });
                };

                function update() {
                    const paginatedContacts = contactCache.paginate(contactCache.get('filtered'));
                    const selectedContacts = contactCache.get('selected');
                    const checkedContacts = _.where(paginatedContacts, { selected: true });

                    scope.totalItems = contactCache.total();
                    scope.disabled = !paginatedContacts.length;
                    scope.selected = selectedContacts;
                    scope.checkAll = paginatedContacts.length === checkedContacts.length;
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
