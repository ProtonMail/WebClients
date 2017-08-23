angular.module('proton.ui')
    .directive('headerSecured', () => {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/ui/header/headerSecured.tpl.html'
        };
    });
