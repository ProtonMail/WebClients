angular.module('proton.dashboard')
    .directive('visionaryColumn', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/visionaryColumn.tpl.html'
        };
    });
