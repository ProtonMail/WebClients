/* @ngInject */
function folderSelectorDropdown() {
    return {
        scope: {
            message: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/folderSelectorDropdown.tpl.html')
    };
}
export default folderSelectorDropdown;
