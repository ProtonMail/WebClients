angular.module('proton.ui')
.directive('validUsername', () => {
    const pattern = new RegExp(/^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$/);
    function isUsernameValid(username) {
        return pattern.test(username);
    }
    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, element, attributes, ngModel) {
            ngModel.$validators.valid = isUsernameValid;
        }
    };
});
