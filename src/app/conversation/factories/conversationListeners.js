angular.module('proton.conversation')
.factory('conversationListeners', ($rootScope, cache, CONSTANTS) => {

    const composerMapActions = {
        replyConversation: 'reply',
        replyAllConversation: 'replyall',
        forwardConversation: 'forward'
    };

    const isDraft = ({ Type }) => Type === CONSTANTS.DRAFT;
    function openComposer(type = '', message = {}) {
        !isDraft(message) && $rootScope.$emit('composer.new', { message, type });
    }

    /**
     * Bind some eventListeners for every action specifics to a message
     * @param  {Message} message
     * @return {Function}         unsubscribe
     */
    function watch(message) {
        const listeners = Object
            .keys(composerMapActions)
            .map((key) => {
                return $rootScope
                    .$on(key, () => openComposer(composerMapActions[key], message));
            });

        return () => {
            listeners.forEach((cb) => cb());
        };
    }

    return watch;
});
