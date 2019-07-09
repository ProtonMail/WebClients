import { uniqID } from '../../../helpers/string';

/* @ngInject */
function password() {
    const generateID = () => `pw${uniqID()}`;

    const formatInput = (node, natives, { autofocus, compare }) => {
        const input = node.querySelector('INPUT');

        Object.keys(natives).forEach((key) => {
            const value = natives[key];
            value && input.setAttribute(key, value);
        });

        compare && input.setAttribute('data-compare-to', 'compare');
        autofocus && input.setAttribute('autofocus', true);
    };

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/formUtils/password.tpl.html'),
        scope: {
            value: '=',
            form: '=',
            compare: '='
        },
        compile(element, { autofocus, compare, id = generateID(), name = '', placeholder = '', tabindex = 0 }) {
            formatInput(element[0], { id, name, placeholder, tabindex }, { compare, autofocus });

            return (scope, el, { autofocus }) => {
                const $input = el[0].querySelector('.password-input');
                scope.input = scope.form[name];
                scope.message = scope.form[name].$error;

                if (autofocus && document.activeElement !== $input) {
                    _rAF(() => $input.focus());
                }

                const onClick = ({ target }) => {
                    const mode = target.dataset.mode;
                    if (mode) {
                        el[0].setAttribute('data-current-mode', mode);
                        $input.type = mode === 'cleartext' ? 'text' : 'password';
                    }
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            };
        }
    };
}
export default password;
