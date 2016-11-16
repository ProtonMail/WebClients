angular.module('proton.core')
.factory('showPassword', (gettextCatalog) => {
    return {
        restrict: 'A',
        link(scope, element) {
            if (!$.browser.msie) {
                function toggleType() {
                    const currentType = element.getAttribute('type');
                    const newType = (currentType === 'password') ? 'text' : 'password';
                    element.setAttribute('type', newType)
                    anchor.innerHTML = (currentType === 'password') ? show : hide;
                }
                const show = gettextCatalog.getString('Show', null, 'Action');
                const hide = gettextCatalog.getString('Hide', null, 'Action');
                const anchor = document.createElement('a');
                anchor.innerHTML = show;
                anchor.addEventListener('click', toggleType);
                element.appendChild(anchor);
                scope.$on('$destroy', () => { anchor.removeEventListener('click', toggleType); });
            }
        }
    };
});
