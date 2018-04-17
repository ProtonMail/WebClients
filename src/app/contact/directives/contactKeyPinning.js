/* @ngInject */
function contactKeyPinning(gettextCatalog) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactKeyPinning.tpl.html'),
        compile(elem) {
            elem[0].querySelector('.contactItem-label input').value = gettextCatalog.getString(
                'Key Pinning',
                null,
                'Contact item label'
            );
        }
    };
}
export default contactKeyPinning;
