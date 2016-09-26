angular.module('proton.conversation')
.factory('conversationListeners', ($rootScope, cache, CONSTANTS) => {
    function isDraft({Type}) {
        return Type === CONSTANTS.DRAFT;
    }

    function openComposer(type = '', message = {}) {
        if (isDraft(message) === false) {
            $rootScope.$emit('composer.new', {message, type});
        }
    }

    function getLastMessage(conversationID = '') {
        const messages = cache.queryMessagesCached(conversationID);
        const ordered = cache.orderMessage(messages, false);
        const message = _.last(ordered);

        return message;
    }

    $rootScope.$on('replyConversation', (event, conversationID = '') => {
        const message = getLastMessage(conversationID);

        openComposer('reply', message);
    });

    $rootScope.$on('replyAllConversation', (event, conversationID = '') => {
        const message = getLastMessage(conversationID);

        openComposer('replyall', message);
    });

    $rootScope.$on('forwardConversation', (event, conversationID = '') => {
        const message = getLastMessage(conversationID);

        openComposer('forward', message);
    });
});
