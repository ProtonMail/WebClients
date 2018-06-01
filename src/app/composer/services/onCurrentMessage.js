/* @ngInject */
function onCurrentMessage(dispatchers) {
    const DEFAULT_ID = 'editor';

    const { on } = dispatchers();
    /**
     * Check if this is the current instance of the editor
     * @param  {Message} options.ID ID of the current message
     * @param  {String} options.ID  ID of the message loaded
     * @return {Boolean}
     */
    const isCurrent = (currentMessage = {}, otherMessage = {}) => {
        const currentID = currentMessage.ID || DEFAULT_ID;
        const otherID = otherMessage.ID || DEFAULT_ID;
        return otherID === currentID;
    };

    const onCurrentMessage = (scope, cb) => (e, { type, data = {} }) => {
        isCurrent(scope.message, data.message) && cb(type, data);
    };

    /**
     * Create a listener and set a filter by message for it
     * @param  {String}   event Event Name
     * @param  {Scope}   scope
     * @param  {Function} cb    Actions callback
     * @return {Function}         unsubscribe
     */
    return (event, scope, cb) => on(event, onCurrentMessage(scope, cb));
}
export default onCurrentMessage;
