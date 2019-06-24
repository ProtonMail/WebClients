/* @ngInject */
function dropdownButton() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/dropdownButton.tpl.html'),
        transclude: true
    };
}
export default dropdownButton;
