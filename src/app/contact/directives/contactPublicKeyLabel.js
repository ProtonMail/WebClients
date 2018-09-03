/* @ngInject */
function contactPublicKeyLabel() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyLabel.tpl.html'),
        link(scope, el, { textTranslate }) {
            scope.text = textTranslate;
        }
    };
}
export default contactPublicKeyLabel;
