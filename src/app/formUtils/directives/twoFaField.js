angular.module('proton.formUtils')
.directive('twoFaField', () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/formUtils/twoFaField.tpl.html',
        scope: { value: '=' },
        compile(element, { id = '', name = '', placeholder = '', tabindex = 0, autofocus = false }) {
            const input = element[0];

            input.setAttribute('id', id);
            input.setAttribute('name', name);
            input.setAttribute('placeholder', placeholder);
            input.setAttribute('tabindex', tabindex);

            autofocus && input.setAttribute('autofocus', autofocus);
        }
    };
});
