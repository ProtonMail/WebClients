import { uniqID } from '../../../helpers/string';
import { isMac, isFirefox } from '../../../helpers/browser';

const isMacOS = isMac();
// Firefox doesn't work with text-security property :/
if (isMacOS && isFirefox()) {
    const link = document.createElement('LINK');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = '/assets/fonts/text-security-disc.css';
    document.body.appendChild(link);
}

/* @ngInject */
function password() {
    const generateID = () => `pw${uniqID()}`;

    const formatInput = (node, natives, { autofocus, compare }) => {
        const input = node.querySelector('INPUT');

        Object.keys(natives).forEach((key) => {
            const value = natives[key];
            value && input.setAttribute(key, value);
        });

        // Issue with input password on MacOS -> dead keys don't work
        // NOTE: 1Password doesn't recognize the input to auto-fill the form
        // if (isMacOS) {
        //     input.classList.add('password-input-mac');
        //     input.type = 'text';
        // }

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
                scope.message = scope.form[name].$error;

                if (autofocus && document.activeElement !== $input) {
                    _rAF(() => $input.focus());
                }

                // We need to re-force the type password on submit to allow the user to save the password
                if (!isMacOS) {
                    return;
                }

                const onFocus = ({ target }) => {
                    target.type = 'text';
                };
                const onBlur = ({ target }) => {
                    target.type = 'password';
                };
                const onEnter = ({ key }) => {
                    key === 'Enter' && onBlur({ target: $input });
                };

                $input.addEventListener('blur', onBlur);
                $input.addEventListener('focus', onFocus);
                document.addEventListener('keydown', onEnter);

                scope.$on('$destroy', () => {
                    $input.removeEventListener('blur', onBlur);
                    $input.removeEventListener('focus', onFocus);
                    document.removeEventListener('keydown', onEnter);
                });
            };
        }
    };
}
export default password;
