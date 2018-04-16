/* @ngInject */
function toggle(gettextCatalog, $rootScope) {
    const I18N = {
        YES: gettextCatalog.getString('Yes', null, 'Text displays in the toggle component, make it shorter as possible'),
        NO: gettextCatalog.getString('No', null, 'Text displays in the toggle component, make it shorter as possible'),
        ON: gettextCatalog.getString('ON', null, 'Text displays in the toggle component, make it shorter as possible'),
        OFF: gettextCatalog.getString('OFF', null, 'Text displays in the toggle component, make it shorter as possible')
    };

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/directives/toggle.tpl.html'),
        scope: {
            id: '@', // ID if uniq logic needed
            status: '=', // status value
            name: '@' // event name called
        },
        link(scope, element, { on = 'YES', off = 'NO' }) {
            scope.on = I18N[on];
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
}
export default toggle;
