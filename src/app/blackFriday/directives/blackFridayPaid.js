angular.module('proton.blackFriday')
    .directive('blackFridayPaid', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/blackFriday/blackFridayPaid.tpl.html'
        };
    });
