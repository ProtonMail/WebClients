angular.module('proton.message', [])
.directive('foldersMessage', function($rootScope, CONSTANTS) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/message/folders.tpl.html',
        replace: true,
        scope: {
            message: '='
        },
        link: function(scope, element, attrs) {
            var unsubscribe;
            var build = function(event, message) {
                if (angular.isArray(message.LabelIDs)) {
                    scope.archive = _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.archive);
                    scope.trash = _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash);
                    scope.spam = _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam);
                }

                if (angular.isNumber(message.Type)) {
                    scope.sent = message.Type === 2 || message.Type === 3;
                    scope.drafts = message.Type === 1;
                }
            };

            unsubscribe = $rootScope.$on('foldersMessage.' + scope.message.ID, build);
            scope.$on('$destroy', unsubscribe);
            build(undefined, scope.message);
        }
    };
});
