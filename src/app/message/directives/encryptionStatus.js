/* @ngInject */
function encryptionStatus() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/message/encryptionStatus.tpl.html')
    };
}
export default encryptionStatus;
