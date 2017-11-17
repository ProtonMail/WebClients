angular.module('proton.search')
    .directive('searchContact', ($rootScope, $state, $stateParams, contactCache, gettextCatalog) => {
        const searchContact = gettextCatalog.getString('Search contacts');
        const dispatch = (keyword) => $rootScope.$emit('contacts', { type: 'searchingContact', data: { keyword } });

        return {
            replace: true,
            restrict: 'E',
            scope: {},
            templateUrl: 'templates/search/searchContact.tpl.html',
            link(scope, element) {
                const $input = element.find('.searchInput');
                const onSubmit = () => {
                    const keyword = scope.query;

                    $state.go($state.$current.name, { page: 1, keyword }, { notify: false })
                        .then(() => dispatch(keyword));
                };
                const onReset = () => {
                    $state.go('secured.contacts', { page: 1, keyword: null }, { notify: false })
                        .then(() => dispatch(''));
                };
                const update = () => {
                    const total = contactCache.total();
                    const placeholder = total ? `${searchContact} (${total})` : searchContact;

                    $input.prop('placeholder', placeholder);
                };
                const unsubscribe = $rootScope.$on('contacts', (event, { type }) => {
                    (type === 'contactsUpdated') && update();
                });

                update();

                element.on('submit', onSubmit);
                element.on('reset', onReset);
                $input.on('input', _.debounce(onSubmit, 300));
                scope.query = $stateParams.keyword || '';

                scope.$on('$destroy', () => {
                    unsubscribe();
                    element.off('submit', onSubmit);
                    element.off('reset', onReset);
                    $input.off('input', _.debounce(onSubmit, 300));
                });
            }
        };
    });
