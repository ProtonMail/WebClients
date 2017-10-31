angular.module('proton.ui')
    .directive('toggle', (gettextCatalog, $rootScope) => {

        const I18N = {
            YES: gettextCatalog.getString('Yes', null, 'Title'),
            NO: gettextCatalog.getString('No', null, 'Title'),
            ON: gettextCatalog.getString('ON', null, 'Title'),
            OFF: gettextCatalog.getString('OFF', null, 'Title')
        };

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/directives/toggle.tpl.html',
            scope: {
                id: '@', // ID if uniq logic needed
                status: '=', // status value
                name: '@' // event name called
            },
            link(scope, element, { on = 'YES', off = 'NO' }) {

                scope.offn = I18N[on];
                scope.off = I18N[off];

                function onClick() {
                    scope.$applyAsync(() => {
                        scope.status = !scope.status;
                        if (scope.name) {
                            $rootScope.$emit(scope.name, { status: scope.status, id: scope.id });
                        }
                    });
                }

                element.on('click', onClick);
                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                });
            }
        };
    });
