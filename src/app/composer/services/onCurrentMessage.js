/* @ngInject */
function onCurrentMessage(dispatchers) {
    const { on } = dispatchers();
    /**
     * Check if this is the current instance of the editor
     * @param  {Message} options.message Current message
     * @param  {String} options.ID      ID of the message loaded
     * @return {Boolean}
     */
    const isCurrent = ({ message = {} }, { ID = 'editor' } = {}) => {
        const currentID = message.ID || 'editor';
        return ID === currentID;
    };

    const onCurrentMessage = (scope, cb) => (e, { type, data = {} }) => {
        isCurrent(scope, data.message) && cb(type, data);
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
