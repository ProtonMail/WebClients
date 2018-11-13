/* @ngInject */
function contactGroupsDropdown(needUpgrade) {
    return {
        scope: {
            model: '=',
            type: '@'
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactGroupsDropdown.tpl.html'),
        link(scope, el) {
            if (needUpgrade({ notify: false })) {
                el[0].classList.add('contactGroupsDropdown-free');

                const onClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    needUpgrade.notify();
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            }
        }
    };
}
export default contactGroupsDropdown;
