angular.module('proton.message')
.directive('labelsMessage', ($rootScope, $filter, $state) => {
    const toLabels = $filter('labels');
    const HIDE_CLASSNAME = 'labelsElement-hidden';

    const moreVisibility = (node) => ({
        hide() {
            node.classList.add(HIDE_CLASSNAME);
        },
        show() {
            _rAF(() => node.classList.remove(HIDE_CLASSNAME));
        }
    });

    return {
        templateUrl: 'templates/message/labelsMessage.tpl.html',
        replace: true,
        link(scope, el, { button }) {

            if (button === 'hidden') {
                el[0].classList.add('labelsMessage-hidden-btn');
            }

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
        }
    };
});
