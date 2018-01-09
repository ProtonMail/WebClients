/* @ngInject */
function messageExtra() {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageExtra.tpl.html'),
        replace: true
    };
}
export default messageExtra;
