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
        compile(element, { autofocus, compare, id = '', name = '', placeholder = '', tabindex = 0 }) {
            const input = element[0].querySelector('input');
            input.setAttribute('id', id);
            input.setAttribute('name', name);
            input.setAttribute('placeholder', placeholder);
            input.setAttribute('tabindex', tabindex);

            (compare) && input.setAttribute('data-compare-to', 'compare');
            (autofocus) && input.setAttribute('autofocus', true);

            return (scope, el, { autofocus }) => {
                const $input = el[0].querySelector('.password-input');
                scope.message = scope.form[name].$error;
                scope.max = CONSTANTS.LOGIN_PW_MAX_LEN;

                if (autofocus && document.activeElement !== $input) {
                    _rAF(() => $input.focus());
                }
            };
        }
    };
});
