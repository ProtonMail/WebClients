angular.module('proton.core')
.directive('togglePassword', (gettextCatalog) => {
    return {
        restrict: 'A',
        compile(element) {
            const isIE = $.browser.msie;
            if (!isIE) {
                const anchor = document.createElement('a');
                element.wrap('<div class="pm_toggle_password"/>').after(anchor);
                return (scope, el) => {
                    const show = gettextCatalog.getString('Show', null, 'Action');
                    const hide = gettextCatalog.getString('Hide', null, 'Action');
                    anchor.innerHTML = show;
                    const onClick = () => {
                        const type = (el[0].getAttribute('type') === 'text') ? 'password' : 'text';
                        el[0].setAttribute('type', type);
                        anchor.innerHTML = (type === 'password') ? show : hide;
                    };
                    anchor.addEventListener('click', onClick);
                    scope.$on('$destroy', () => anchor.removeEventListener('click', onClick));
                };
            }
        }
    };
});
