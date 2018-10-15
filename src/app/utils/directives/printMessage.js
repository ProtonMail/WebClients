/* @ngInject */
function printMessage(printMessageModel) {
    return {
        scope: {
            config: '=printMessageConfig'
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/utils/printMessage.tpl.html'),
        link(scope) {
            scope.model = printMessageModel(scope.config);
            scope.message = scope.config.message;
        }
    };
}
export default printMessage;
