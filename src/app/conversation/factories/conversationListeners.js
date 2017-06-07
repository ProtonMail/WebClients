angular.module('proton.conversation')
.factory('conversationListeners', ($rootScope, CONSTANTS) => {

    const composerMapActions = {
        replyConversation: 'reply',
        replyAllConversation: 'replyall',
        forwardConversation: 'forward'
    };

    const isDraft = ({ Type }) => Type === CONSTANTS.DRAFT;
    const isDecrypted = ({ failedDecryption }) => !failedDecryption;

    const openComposer = (key, message = {}) => () => {
        if (!isDraft(message) && isDecrypted(message)) {
            const type = composerMapActions[key];
            $rootScope.$emit('composer.new', { message, type });
        }
    };

    /**
     * Listen to hotkeys and proxy the call to emit a composer event based on
     * 2 conditions:
     *     - not a draft
     *     - decrypt:success
     * @param  {Message} message
     * @return {Function}         unsubscribe
     */
    function watch(message) {
        const listeners = Object.keys(composerMapActions)
            .map((key) => $rootScope.$on(key, openComposer(key, message)));

        return () => {
            listeners.forEach((cb) => cb());
            listeners.length = 0;
        };
    }

    return watch;
});
