/* @ngInject */
function stickyMessages() {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/partials/stickyMessages.tpl.html')
    };
}

export default stickyMessages;
