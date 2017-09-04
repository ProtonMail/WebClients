angular.module('proton.filter')
    .directive('filterView', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/filterView.tpl.html',
            scope: {}
        };
    });
