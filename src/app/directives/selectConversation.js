angular.module('proton.selectConversation', [])
.directive('ptSelectConversation', () => ({
    replace: true,
    templateUrl: 'templates/directives/ptSelectConversation.tpl.html'
}))
.directive('ptSelectAllConversations', ($rootScope) => ({
    link(scope, el) {

        $rootScope.numberElementChecked = 0;

        function onChange({ target }) {
            const isChecked = target.checked;

            scope
                .$applyAsync(() => {

                    _.each(scope.conversations, (conversation) => {
                        conversation.Selected = isChecked;
                    });

                    $rootScope.numberElementChecked = isChecked ? scope.conversations.length : 0;
                    $rootScope.showWelcome = false;
                });
        }
        el.on('change', onChange);

        scope
        .$on('$destroy', () => {
            el.off('change', onChange);
        });
    }

}))
.directive('ptSelectMultipleConversations', ($rootScope) => {

    const countChecked = (conversations) => _.where(conversations, { Selected: true }).length;

    /**
    * Select many conversations and update the scope
    * @param  {$scope} scope
    * @return {function}       (previous, from, to)
    */
    function selectConversations(scope) {

        /**
        * Update the scope with selected conversations
        * @param  {Object} previous Previous conversation selected
        * @param  {Number} from     Index conversation
        * @param  {Number} to       Index conversation
        * @return {void}
        */
        return (previous, from, to) => {
            _.each(scope.conversations, (conversation, i) => {
                if (i >= from && i <= to) {
                    conversation.Selected = previous.conversation.Selected;
                } else {
                    return false; // Break
                }
            });

            $rootScope.numberElementChecked = countChecked(scope.conversations);
        };
    }

    return {
        link(scope, el) {
            let previous = null;
            const conversationsToSelect = selectConversations(scope);

            function onClick({ target, shiftKey }) {
                const index = +target.getAttribute('data-index');

                if (target.nodeName !== 'INPUT' || !/ptSelectConversation/.test(target.className)) {
                    return;
                }

                const isChecked = target.checked;

                scope
                    .$applyAsync(() => {
                        scope.conversations[index].Selected = isChecked;
                        $rootScope.numberElementChecked = countChecked(scope.conversations);

                        if (shiftKey && previous) {
                            const from = Math.min(index, previous.index);
                            const to = Math.max(index, previous.index);
                            conversationsToSelect(previous, from, to);

                            // Unselect the latest click if we unselect a list of checkbox
                            target.checked = previous.conversation.Selected;
                        }

                        $rootScope.showWelcome = false;

                        previous = {
                            index,
                            conversation: scope.conversations[index]
                        };
                    });

            }

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
});
