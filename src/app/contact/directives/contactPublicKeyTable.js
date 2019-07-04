/* @ngInject */
function contactPublicKeyTable() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyTable.tpl.html'),
        scope: {
            items: '=',
            enableDelete: '=',
            enableTrust: '='
        },
        link(scope) {
            scope.allTrusted = (scope.items || []).every(({ hide }) => hide) && (scope.items || []).length;
        }
    };
}
export default contactPublicKeyTable;
