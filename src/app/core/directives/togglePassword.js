angular.module('proton.core')
.directive('togglePassword', ($compile, gettextCatalog) => {
    return {
        restrict: 'A',
        link(scope, elem) {
            if (!$.browser.msie) {
                const show = gettextCatalog.getString('Show', null, 'Action');
                const hide = gettextCatalog.getString('Hide', null, 'Action');

                const toggler = document.createElement('a');
                toggler.innerHTML = show;

                const toggleType = () => {
                    const type = (elem.attr('type') === 'text' ? 'password' : 'text');
                    elem.attr('type', type);
                    toggler.innerHTML = (type === 'password') ? show : hide;
                };

                toggler.addEventListener('click', toggleType);
                elem.wrap('<div class="pm_toggle_password"/>').after(toggler);
                elem.attr('type', 'password');

                scope.$on('$destroy', () => { toggler.removeEventListener('click', toggleType); });
            }
        }
    };
});
