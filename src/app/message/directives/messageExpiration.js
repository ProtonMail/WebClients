/* @ngInject */
function messageExpiration() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageExpiration.tpl.html')
    };
}

export default messageExpiration;
