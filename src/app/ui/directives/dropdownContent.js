/* @ngInject */
function dropdownContent() {
    const CLASSNAME = {
        wide: 'dropDown-content--wide'
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/dropdownContent.tpl.html'),
        transclude: true,
        link(scope, el, { type }) {
            const getID = () => el[0].parentElement.getAttribute('data-dropdown-id');
            const dropdownId = getID();
            el[0].setAttribute('data-dropdown-id', dropdownId);

            CLASSNAME[type] && el[0].classList.add(CLASSNAME[type]);

            !dropdownId &&
                scope.$applyAsync(() => {
                    const dropdownId = getID();
                    el[0].setAttribute('data-dropdown-id', dropdownId);
                });
        }
    };
}
export default dropdownContent;
