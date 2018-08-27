import { DRAFT } from '../../constants';

/* @ngInject */
function conversationListeners(dispatchers) {
    const { dispatcher, on, unsubscribe } = dispatchers(['composer.new']);
    const composerMapActions = {
        replyConversation: 'reply',
        replyAllConversation: 'replyall',
        forwardConversation: 'forward'
    };

    const isDraft = ({ Type }) => Type === DRAFT;
    const isDecrypted = ({ failedDecryption }) => !failedDecryption;

    const openComposer = (key, message = {}) => () => {
        if (!isDraft(message) && isDecrypted(message)) {
            const type = composerMapActions[key];
            dispatcher['composer.new'](type, { message });
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
        Object.keys(composerMapActions).map((key) => on(key, openComposer(key, message)));

        return () => {
            unsubscribe();
        };
    }

    return watch;
}
export default conversationListeners;
