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
                let $input = el[0].querySelector('.password-input');
                scope.message = scope.form[name].$error;

                if (autofocus && document.activeElement !== $input) {
                    _rAF(() => $input.focus());
                }

                scope.$on('$destroy', () => {
                    $input.value = '';
                    $input = null;
                });
            };
        }
    };
}
export default password;
