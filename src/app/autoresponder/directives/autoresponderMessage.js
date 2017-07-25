angular.module('proton.autoresponder')
    .directive('autoresponderMessage', (autoresponderModel, $rootScope) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/autoresponderMessage.tpl.html',
            scope: {
                // we need this scope, as we don't have good squire events to push the message on change to the model.
                message: '='
            },
            link(scope, elem, { disabled }) {
                const unsubscribe = [];

                scope.disabled = disabled === 'true';
                scope.halfMessageLength = autoresponderModel.constants.HALF_MESSAGE_LENGTH;
                scope.maxMessageLength = autoresponderModel.constants.MAX_MESSAGE_LENGTH;

                unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        scope.message = data.autoresponder.message;
                    }
                }));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
