angular.module('proton.ui')
    .directive('headerNoAuth', () => ({
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/ui/header/headerNoAuth.tpl.html'
    }));
