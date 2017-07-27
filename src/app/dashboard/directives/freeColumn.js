angular.module('proton.dashboard')
    .directive('freeColumn', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/freeColumn.tpl.html'
        };
    });
