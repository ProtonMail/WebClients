/* @ngInject */
function contactPublicKeyLabel(gettextCatalog, translator) {
    const I18N = translator(() => ({
        available: gettextCatalog.getString('Available Public Keys', null, 'Label'),
        public: gettextCatalog.getString('Public Keys', null, 'Laebel'),
        trusted: gettextCatalog.getString('Trusted Public Keys', null, 'Label')
    }));

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyLabel.tpl.html'),
        link(scope, el, { textTranslate }) {
            scope.text = I18N[textTranslate];
        }
    };
}
export default contactPublicKeyLabel;
