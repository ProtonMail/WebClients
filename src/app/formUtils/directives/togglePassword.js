import dedentTpl from '../../../helpers/dedent';

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
