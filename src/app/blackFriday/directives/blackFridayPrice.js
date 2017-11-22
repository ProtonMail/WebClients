angular.module('proton.blackFriday')
    .directive('blackFridayPrice', () => {
        return {
            restrict: 'E',
            replace: true,
            scope: { amount: '=', strike: '=', currency: '=' },
            templateUrl: 'templates/blackFriday/blackFridayPrice.tpl.html'
        };
    });
