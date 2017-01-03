angular.module('proton.formUtils')
.directive('validRecovery', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: { domain: '=', username: '=' },
        link(scope, element, attributes, ngModel) {
            function isRecoveryEmailValid(email) {
                const { username = '', domain = '' } = scope;
                const current = `${username}@${domain}`;
                return email !== current;
            }
            ngModel.$validators.valid = isRecoveryEmailValid;
        }
    };
});
