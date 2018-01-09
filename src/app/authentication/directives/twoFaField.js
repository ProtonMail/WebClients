/* @ngInject */
function twoFaField() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/authentication/twoFaField.tpl.html')
    };
}
export default twoFaField;
