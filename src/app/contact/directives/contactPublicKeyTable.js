/* @ngInject */
function contactPublicKeyTable() {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/contact/contactPublicKeyTable.tpl.html'),
        scope: {
            items: '=',
            enableTrust: '@',
            enableDelete: '@'
        }
    };
}
export default contactPublicKeyTable;
