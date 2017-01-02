angular.module('proton.formUtils')
.directive('togglePassword', (gettextCatalog) => {
    const SHOW = gettextCatalog.getString('Show', null, 'Action');
    const HIDE = gettextCatalog.getString('Hide', null, 'Action');
    const isIE = $.browser.msie;

    return {
        restrict: 'A',
        compile(element) {
            if (!isIE) {
                const btn = document.createElement('BUTTON');
                btn.type = 'button';
                btn.className = 'togglePassword-btn-toggle';

                const container = element[0].parentElement;
                container.appendChild(btn);

                return (scope, el) => {
                    btn.innerHTML = SHOW;
                    const onClick = () => {
                        const type = (el[0].getAttribute('type') === 'text') ? 'password' : 'text';
                        el[0].setAttribute('type', type);
                        btn.textContent = (type === 'password') ? SHOW : HIDE;
                    };
                    btn.addEventListener('click', onClick);
                    scope.$on('$destroy', () => {
                        btn.removeEventListener('click', onClick);
                    });
                };
            }
        }
    };
});
