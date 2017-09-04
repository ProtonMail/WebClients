angular.module('proton.filter')
    .directive('customFilterList', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/customFilterList.tpl.html',
            scope: {}
        };
    });
