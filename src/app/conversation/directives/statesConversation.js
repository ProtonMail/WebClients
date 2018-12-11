/* @ngInject */
function statesConversation() {
    return {
        restrict: 'E',
        replace: true,
        template: `
            <i class="fa" ng-class="{
                'fa-mail-reply': conversation.isReplied(),
                'fa-mail-reply-all': conversation.isRepliedAll(),
                'fa-mail-forward': conversation.isForwarded()
            }"></i>
        `
    };
}
export default statesConversation;
