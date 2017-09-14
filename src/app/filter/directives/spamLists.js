angular.module('proton.filter')
    .directive('spamLists', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/spamLists.tpl.html'
        };
    });
