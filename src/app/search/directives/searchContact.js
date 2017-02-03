angular.module('proton.search')
    .directive('searchContact', ($rootScope) => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/search/searchContact.tpl.html',
        link(scope, el) {
            const onSubmit = () => $rootScope.$broadcast('searchContacts', scope.query);
            const onInput = _.throttle(onSubmit, 60);

            el.on('input', onInput);
            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('input', onInput);
                el.off('submit', onSubmit);
            });
        }
    }));
