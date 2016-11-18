angular.module('proton.core')
.directive('cardPanel', () => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/cardPanel.tpl.html',
        scope: { card: '=' }
    };
});
