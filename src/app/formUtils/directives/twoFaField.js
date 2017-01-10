angular.module('proton.formUtils')
.directive('twoFaField', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/formUtils/twoFaField.tpl.html'
    };
});
