/* @ngInject */
function autoresponderMessage(autoresponderModel, dispatchers) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/autoresponder/autoresponderMessage.tpl.html'),
        scope: {
            // we need this scope, as we don't have good squire events to push the message on change to the model.
            message: '='
        },
        link(scope, elem, { disabled }) {
            const { on, unsubscribe } = dispatchers();

            scope.disabled = disabled === 'true';
            scope.halfMessageLength = autoresponderModel.constants.HALF_MESSAGE_LENGTH;
            scope.maxMessageLength = autoresponderModel.constants.MAX_MESSAGE_LENGTH;
            scope.isEmpty = (message) =>
                message !== null &&
                $(message)
                    .text()
                    .trim().length === 0;

            on('autoresponder', (event, { type, data = {} }) => {
                if (type === 'update') {
                    scope.message = data.autoresponder.message;
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default autoresponderMessage;
