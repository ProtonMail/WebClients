angular.module('proton.blackFriday')
    .directive('blackFridayFree', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/blackFriday/blackFridayFree.tpl.html'
        };
    });
