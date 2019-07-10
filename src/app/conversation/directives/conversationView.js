import _ from 'lodash';

/* @ngInject */
const conversationView = ($state, $stateParams, cache, tools) => ({
    restrict: 'E',
    replace: true,
    template:
        '<div class="conversationView-container"><conversation ng-if="conversation" data-conversation="conversation"></conversation></div>',
    link(scope) {
        const conversationID = $stateParams.id;
        const ID = tools.currentLocation();

        function back() {
            const route = $state.$current.name.replace('.element', '');
            $state.go(route, { id: null });
        }

        // Prevent coming from no where #6939
        if (!ID) {
            $state.go('secured.inbox');
        }

        cache.getConversation(conversationID).then((conversation) => {
            const label = _.find(conversation.Labels, { ID });

            if (label || $state.includes('secured.search.**')) {
                return (scope.conversation = conversation);
            }

            return back();
        });
    }
});
export default conversationView;
