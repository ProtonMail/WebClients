angular.module('proton.formUtils')
.directive('password', (CONSTANTS) => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/core/password.tpl.html',
        scope: {
            value: '=',
            form: '=',
            compare: '='
        },
        compile(element, attrs) {
            const { id = '', name = '', placeholder = '' } = attrs;
            const input = element[0].querySelector('input');
            input.setAttribute('id', id);
            input.setAttribute('name', name);
            input.setAttribute('placeholder', placeholder);
            return (scope) => {
                scope.message = scope.form[name].$error;
                scope.max = CONSTANTS.LOGIN_PW_MAX_LEN;
            };
        }
    };
});
