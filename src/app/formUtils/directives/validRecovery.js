angular.module('proton.formUtils')
.directive('validRecovery', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: { domain: '=', username: '=' },
        link(scope, element, attributes, ngModel) {
            function isRecoveryEmailValid(email) {
                const current = scope.username + '@' + scope.domain;
                return email !== current;
            }
            ngModel.$validators.valid = isRecoveryEmailValid;
        }
    };
});
