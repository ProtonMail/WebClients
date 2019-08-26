/* @ngInject */
function folderSelectorDropdown() {
    return {
        scope: {
            message: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/folderSelectorDropdown.tpl.html'),
        compile(el, { mode }) {
            el[0].querySelector('dropdown-container').setAttribute('data-mode', mode);
        }
    };
}
export default folderSelectorDropdown;
