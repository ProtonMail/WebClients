angular.module('proton.formUtils')
    .directive('validRecovery', () => {

        const validator = (scope) => (email) => {
            const { username = '', domain = '' } = scope;
            const current = `${username}@${domain}`;
            return email !== current;
        };

        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                domain: '=validRecoveryDomain',
                username: '=validRecoveryUsername'
            },
            link(scope, el, attr, ngModel) {
                ngModel.$validators.validUsername = validator(scope);
            }
        };
    });
