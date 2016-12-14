angular.module('proton.elements')
.directive('ptStar', ($rootScope, CONSTANTS, gettextCatalog, tools, actionConversation) => {

    /**
    * Check in LabelIDs to see if the conversation or message is starred
    * @param {Object} item
    */
    function isStarred(item) {
        return Array.isArray(item.LabelIDs) && item.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
    }

    /**
    * Star or unstar a message/conversation
    * @param {Object} element - conversation or message
    * @param {String} type Type of message, conversation or message
    */
    function toggleStar(item, type) {
        const todoAction = isStarred(item) ? 'unstar' : 'star';

        if (type === 'conversation') {
            actionConversation[todoAction + 'Conversation'](item.ID);
        }

        if (type === 'message') {
            $rootScope.$emit('messageActions', { action: todoAction, data: { id: item.ID } });
        }
    }

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: 'templates/elements/ptStar.tpl.html',
        link(scope, el, attr) {

            const customType = attr.ptStarType || tools.typeList();

            scope.isStarred = () => isStarred(scope.model);

            function onClick(e) {
                if (e.target.nodeName === 'A') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleStar(scope.model, customType);
                }
            }

            el.on('click', onClick);

            scope
            .$on('$destroy', () => {
                el.off('click', onClick);
                $('.tooltip').remove(); // Clear all tooltips when we destroy a conversation cf #3513
            });
        }
    };
});
