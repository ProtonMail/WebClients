import dedentTpl from '../../../helpers/dedent';
import { isMac } from '../../../helpers/browser';

/* @ngInject */
function togglePassword(gettextCatalog) {
    const CLASS_DISPLAY_PASSWORD = 'togglePassword-btn-display';
    const TOOLTIPS = {
        SHOW: gettextCatalog.getString('Show password', null, 'toggle password'),
        HIDE: gettextCatalog.getString('Hide password', null, 'toggle password')
    };

    const template = dedentTpl`<button type="button" class="togglePassword-btn-toggle">
        <i class="togglePassword-icon-toText fa fa-eye" pt-tooltip="${TOOLTIPS.SHOW}"></i>
        <i class="togglePassword-icon-toPassword fa fa-eye-slash" pt-tooltip="${TOOLTIPS.HIDE}"></i>
    </button>`;

    return {
        restrict: 'A',
        compile(el) {
            const container = el[0].parentElement;
            container.insertAdjacentHTML('beforeEnd', template);
            container.classList.add('customPasswordToggler');

            return (scope, el) => {
                const btn = el[0].parentElement.querySelector('.togglePassword-btn-toggle');

                const onClick = () => {
                    if (isMac()) {
                        const isPw = el[0].classList.contains('password-input-mac');

                        /*
                            Force the input to be text, as we change the type to password onBlur
                         */
                        if (isPw) {
                            el[0].type = 'text';
                        }
                        return el[0].classList.toggle('password-input-mac');
                    }

                    const type = el[0].type === 'text' ? 'password' : 'text';
                    el[0].setAttribute('type', type);
                    btn.classList.toggle(CLASS_DISPLAY_PASSWORD);
                };

                btn.addEventListener('click', onClick);
                scope.$on('$destroy', () => {
                    btn.removeEventListener('click', onClick);
                });
            };
        }
    };
}
export default togglePassword;
