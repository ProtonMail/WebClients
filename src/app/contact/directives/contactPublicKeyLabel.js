/* @ngInject */
function contactPublicKeyLabel(gettextCatalog) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyLabel.tpl.html'),
        link(scope, el, { valueTranslate }) {
            scope.value = gettextCatalog.getString(valueTranslate);
            scope.uploadShow = scope.showButton === 'true';
        }
    };
}
export default contactPublicKeyLabel;
