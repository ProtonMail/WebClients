/* @ngInject */
function contactPlaceholder() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactPlaceholder.tpl.html')
    };
}
export default contactPlaceholder;
