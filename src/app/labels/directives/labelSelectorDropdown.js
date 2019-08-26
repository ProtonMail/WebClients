/* @ngInject */
function labelSelectorDropdown() {
    return {
        scope: {
            message: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/labelSelectorDropdown.tpl.html'),
        compile(el, { mode }) {
            el[0].querySelector('dropdown-container').setAttribute('data-mode', mode);
        }
    };
}
export default labelSelectorDropdown;
