/* @ngInject */
function trustPublicKeyInfo() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/trustPublicKeyInfo.tpl.html'),
        scope: {
            keyInfo: '='
        }
    };
}
export default trustPublicKeyInfo;
