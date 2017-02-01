angular.module('proton.sidebar')
    .directive('sidebar', (sidebarModel) => ({
        scope: {},
        replace: true,
        templateUrl: 'templates/partials/sidebar.tpl.html',
        link(scope) {
            scope.listStates = Object.keys(sidebarModel.getStateConfig());
            scope.scrollbarConfig = {
                scrollInertia: 0
            };
        }
    }));
