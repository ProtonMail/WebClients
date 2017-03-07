angular.module('proton.conversation')
    .directive('conversationPlaceholder', () => ({
        replace: true,
        templateUrl: 'templates/partials/conversation-placeholder.tpl.html'
    }));
