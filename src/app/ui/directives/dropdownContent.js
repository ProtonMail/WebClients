/* @ngInject */
function dropdownContent() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/dropdownContent.tpl.html'),
        transclude: true,
        link(scope, el) {
            const getID = () => el[0].parentElement.getAttribute('data-dropdown-id');
            const dropdownId = getID();
            el[0].setAttribute('data-dropdown-id', dropdownId);

            !dropdownId &&
                scope.$applyAsync(() => {
                    const dropdownId = getID();
                    el[0].setAttribute('data-dropdown-id', dropdownId);
                });
        }
    };
}
export default dropdownContent;
