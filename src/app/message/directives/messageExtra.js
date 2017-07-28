angular.module('proton.message')
    .directive('messageExtra', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/message/messageExtra.tpl.html',
            replace: true
        };
    });
