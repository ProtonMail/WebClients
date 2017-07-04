angular.module('proton.ui')
.directive('headerSecuredDesktop', () => {
    return {
        restrict: 'E',
        replace: true,
        controller: 'HeaderController',
        templateUrl: 'templates/ui/header/headerSecuredDesktop.tpl.html'
    };
});
