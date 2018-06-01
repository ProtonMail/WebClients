/* @ngInject */
function contactPublicKeyTable() {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyTable.tpl.html'),
        scope: {
            items: '='
        },
        link(scope, elem, { enableDelete, enableTrust }) {
            scope.enableDelete = enableDelete === 'true';
            scope.enableTrust = enableTrust === 'true';
        }
    };
}
export default contactPublicKeyTable;
