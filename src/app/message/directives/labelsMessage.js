angular.module('proton.message')
.directive('labelsMessage', ($rootScope) => ({
    templateUrl: 'templates/message/labelsMessage.tpl.html',
    replace: true,
    link(scope, el) {

        const onClick = ({ target }) => {

            if (!target.classList.contains('labelsMessage-btn-remove')) {
                return;
            }

            $rootScope.$emit('messageActions', {
                action: 'unlabel',
                data: {
                    messageID: scope.message.ID,
                    conversationID: scope.message.ConversationID,
                    labelID: target.getAttribute('data-label-id')
                }
            });
        };

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });

    }
}));
