angular.module('proton.dashboard')
    .directive('plusColumn', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/plusColumn.tpl.html'
        };
    });
