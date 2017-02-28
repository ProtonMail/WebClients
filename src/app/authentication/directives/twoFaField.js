angular.module('proton.authentication')
.directive('twoFaField', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/authentication/twoFaField.tpl.html'
    };
});
