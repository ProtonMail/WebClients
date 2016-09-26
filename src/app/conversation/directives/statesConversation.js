angular.module('proton.conversation')
.directive('statesConversation', () => {
    return {
        restrict: 'E',
        replace: true,
        scope: { conversation: '=' },
        template: `
            <i class="fa" ng-class="{
                'fa-mail-reply': conversation.IsReplied,
                'fa-mail-reply-all': conversation.IsRepliedAll,
                'fa-mail-forward': conversation.IsForwarded
            }"></i>
        `
    };
});
