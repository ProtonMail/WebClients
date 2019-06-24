/* @ngInject */
function labelSelectorDropdown() {
    return {
        scope: {
            message: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/labelSelectorDropdown.tpl.html')
    };
}
export default labelSelectorDropdown;
